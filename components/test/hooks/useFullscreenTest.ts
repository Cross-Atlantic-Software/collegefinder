'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  startMockTest,
  getMockQuestions,
  submitAnswer,
  getSectionProgress,
  completeTest,
  getTestResults,
  ExamFormat,
} from '@/api/tests';
import type { Question, QuestionEntry, QuestionStatus, SectionProgress, TestResultsData } from '../interface/types';
import { buildSectionMaps, computeSubmitSummary, getQuestionStatusesFromMap, normalizeTestResults } from '../utils';
import { useFullscreenAndWarnings } from './useFullscreenAndWarnings';

export interface UseFullscreenTestProps {
  examId: number;
  format: ExamFormat;
  onExit: () => void;
}

export function useFullscreenTest({ examId, format, onExit }: UseFullscreenTestProps) {
  const [currentSection, setCurrentSection] = useState<string>(() => Object.keys(format.sections)[0]);
  const [currentSubsection, setCurrentSubsection] = useState<'section_a' | 'section_b'>('section_a');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | string[]>('');
  const [questionNumber, setQuestionNumber] = useState(0);
  const [sectionMaps, setSectionMaps] = useState<Record<string, Record<number, QuestionEntry>>>({});
  const [testAttemptId, setTestAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(format.duration_minutes * 60);
  const [sectionProgress, setSectionProgress] = useState<SectionProgress>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [completingTest, setCompletingTest] = useState(false);
  const [showEndTestConfirm, setShowEndTestConfirm] = useState(false);
  const [testResults, setTestResults] = useState<TestResultsData | null>(null);
  const questionViewedAtRef = useRef<number>(Date.now());
  const sectionMapsRef = useRef(sectionMaps);
  const currentSectionRef = useRef(currentSection);
  const questionNumberRef = useRef(questionNumber);
  sectionMapsRef.current = sectionMaps;
  currentSectionRef.current = currentSection;
  questionNumberRef.current = questionNumber;

  const {
    enterFullscreen,
    isFullscreen,
    tabChangeWarning,
    setTabChangeWarning,
  } = useFullscreenAndWarnings({ testAttemptId });

  // —— Start test ——
  const startTest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const startRes = await startMockTest(examId);
      if (!startRes.success || !startRes.data) {
        setError(startRes.message || 'Failed to start test. Please try again shortly.');
        return;
      }
      const { test_attempt_id, mock_test_id } = startRes.data;
      setTestAttemptId(test_attempt_id);
      const qRes = await getMockQuestions(mock_test_id);
      if (!qRes.success || !qRes.data || qRes.data.questions.length === 0) {
        setError(qRes.message || 'Failed to load mock questions. Please try again.');
        return;
      }
      const builtMaps = buildSectionMaps(qRes.data.questions, format);
      setSectionMaps(builtMaps);
      await enterFullscreen();
      const firstSection = Object.keys(format.sections)[0];
      const firstEntry = builtMaps[firstSection]?.[1];
      if (firstEntry) {
        questionViewedAtRef.current = Date.now();
        setCurrentQuestion(firstEntry.question);
        setQuestionNumber(1);
      }
    } catch (e) {
      console.error('Error starting test:', e);
      setError('An error occurred while starting the test');
    } finally {
      setLoading(false);
    }
  }, [examId, format, enterFullscreen]);

  // First question index (1-based) for the current subsection within the current section
  const firstQuestionNumberOfSubsection = useMemo(() => {
    const section = format.sections?.[currentSection];
    if (!section?.subsections) return 1;
    const subKeys = Object.keys(section.subsections);
    let start = 1;
    for (const k of subKeys) {
      if (k === currentSubsection) return start;
      start += section.subsections[k]?.questions ?? 0;
    }
    return start;
  }, [format.sections, currentSection, currentSubsection]);

  // —— Derived section state ——
  const currentSectionMap = sectionMaps[currentSection] || {};
  const totalQuestionsInSection =
    Object.keys(sectionMaps[currentSection] || {}).length ||
    Object.values(format.sections[currentSection]?.subsections ?? {}).reduce(
      (s: number, sub: { questions?: number }) => s + (sub?.questions ?? 0),
      0
    );
  const totalForHeader = Object.values(format.sections[currentSection]?.subsections ?? {}).reduce(
    (s: number, sub: { questions?: number }) => s + (sub?.questions ?? 0),
    0
  );

  // —— Navigation: load question by number (and mark previous as skipped if left without answering) ——
  // Uses refs so palette clicks and Save & Next always see latest sectionMaps/currentSection.
  const loadQuestionForNumber = useCallback((num: number) => {
    if (num < 1) return;
    const section = currentSectionRef.current;
    const map = sectionMapsRef.current[section] || {};
    const entry = map[num];
    const prevNum = questionNumberRef.current;
    if (prevNum >= 1 && prevNum !== num) {
      setSectionMaps((prev) => {
        const sectionMap = prev[section] || {};
        const prevEntry = sectionMap[prevNum];
        if (!prevEntry || prevEntry.status !== 'not_visited') return prev;
        return {
          ...prev,
          [section]: {
            ...sectionMap,
            [prevNum]: { ...prevEntry, status: 'not_answered' },
          },
        };
      });
    }
    if (entry) {
      questionViewedAtRef.current = Date.now();
      setCurrentQuestion(entry.question);
      setSelectedOption(entry.savedOption);
      setQuestionNumber(num);
    }
  }, []);

  useEffect(() => {
    if (testAttemptId && Object.keys(sectionMaps[currentSection] || {}).length > 0) {
      loadQuestionForNumber(firstQuestionNumberOfSubsection);
    }
  }, [currentSection, currentSubsection, testAttemptId, sectionMaps, firstQuestionNumberOfSubsection, loadQuestionForNumber]);

  // —— Progress ——
  const updateProgress = useCallback(async () => {
    if (!testAttemptId) return;
    try {
      const res = await getSectionProgress(testAttemptId);
      if (res.success && res.data) setSectionProgress(res.data.section_progress);
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  }, [testAttemptId]);

  // —— Complete test ——
  const handleCompleteTest = useCallback(async () => {
    if (!testAttemptId) return;
    try {
      setCompletingTest(true);
      setError(null);
      const completeResponse = await completeTest(testAttemptId);
      if (completeResponse.success) {
        let resultsResponse: Awaited<ReturnType<typeof getTestResults>> | null = null;
        try {
          resultsResponse = await getTestResults(testAttemptId);
        } catch {
          // use summary from completeResponse only
        }
        const normalized = normalizeTestResults(completeResponse, resultsResponse);
        setTestResults(normalized);
        setTestCompleted(true);
      } else {
        setError(completeResponse.message || 'Failed to complete test.');
        onExit();
      }
    } catch (e) {
      console.error('Error completing test:', e);
      setError('Failed to complete test. Returning to exams.');
      onExit();
    } finally {
      setCompletingTest(false);
      setShowEndTestConfirm(false);
    }
  }, [testAttemptId, onExit]);

  // —— Timer: auto-submit when time runs out ——
  useEffect(() => {
    if (timeRemaining <= 0 || !testAttemptId) return;
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleCompleteTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining, testAttemptId, handleCompleteTest]);

  // —— Submit answer ——
  const handleSubmitAnswer = useCallback(async () => {
    const hasAnswer = Array.isArray(selectedOption)
      ? selectedOption.length > 0
      : selectedOption !== '';
    if (!testAttemptId || !currentQuestion || !hasAnswer) return;
    try {
      setLoading(true);
      setError(null);
      const timeSpentSeconds = Math.max(0, Math.floor((Date.now() - questionViewedAtRef.current) / 1000));
      const response = await submitAnswer(testAttemptId, currentQuestion.id, {
        selected_option: typeof selectedOption === 'string' ? selectedOption : JSON.stringify(selectedOption),
        time_spent_seconds: timeSpentSeconds,
      });
      if (response.success) {
        const answeredNum = questionNumber;
        setSectionMaps((prev) => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [answeredNum]: { question: currentQuestion, status: 'answered', savedOption: selectedOption },
          },
        }));
        await updateProgress();
        if (answeredNum < totalQuestionsInSection) {
          loadQuestionForNumber(answeredNum + 1);
        } else {
          setCurrentQuestion(null);
          setSelectedOption(currentQuestion.question_type === 'mcq_multiple' ? [] : '');
        }
      } else {
        setError(response.message || 'Failed to submit answer');
      }
    } catch (e) {
      console.error('Error submitting answer:', e);
      setError('An error occurred while submitting the answer');
    } finally {
      setLoading(false);
    }
  }, [
    testAttemptId,
    currentQuestion,
    selectedOption,
    questionNumber,
    currentSection,
    totalQuestionsInSection,
    loadQuestionForNumber,
    updateProgress,
  ]);

  // —— Skip question ——
  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    const skippedNum = questionNumber;
    setSectionMaps((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [skippedNum]: { question: currentQuestion, status: 'not_answered', savedOption: '' },
      },
    }));
    if (skippedNum < totalQuestionsInSection) {
      loadQuestionForNumber(skippedNum + 1);
    } else {
      setCurrentQuestion(null);
      setSelectedOption('');
    }
  }, [currentQuestion, questionNumber, currentSection, totalQuestionsInSection, loadQuestionForNumber]);

  // —— Section / subsection change ——
  const handleSectionChange = useCallback((sectionKey: string) => {
    const section = format.sections[sectionKey];
    const firstSub = section?.subsections
      ? (Object.keys(section.subsections)[0] as 'section_a' | 'section_b')
      : 'section_a';
    setCurrentSection(sectionKey);
    setCurrentSubsection(firstSub);
    setCurrentQuestion(null);
    setSelectedOption('');
    setQuestionNumber(0);
  }, [format.sections]);

  const handleSubsectionChange = useCallback((subsection: 'section_a' | 'section_b') => {
    setCurrentSubsection(subsection);
    setCurrentQuestion(null);
    setSelectedOption('');
    setQuestionNumber(0);
  }, []);

  const handleBackToExams = useCallback(() => {
    setShowEndTestConfirm(false);
    setError(null);
    onExit();
  }, [onExit]);

  // —— Submit summary and question statuses (from utils) ——
  const getQuestionStatuses = useCallback(
    (): Record<number, QuestionStatus> => getQuestionStatusesFromMap(currentSectionMap),
    [currentSectionMap]
  );
  const submitSummary = useMemo(() => computeSubmitSummary(sectionMaps), [sectionMaps]);

  return {
    currentSection,
    currentSubsection,
    currentQuestion,
    selectedOption,
    setSelectedOption,
    questionNumber,
    sectionMaps,
    testAttemptId,
    timeRemaining,
    sectionProgress,
    loading,
    error,
    tabChangeWarning,
    setTabChangeWarning,
    isFullscreen,
    testCompleted,
    completingTest,
    showEndTestConfirm,
    setShowEndTestConfirm,
    testResults,
    format,
    totalQuestionsInSection,
    currentSectionMap,
    startTest,
    loadQuestionForNumber,
    handleSubmitAnswer,
    handleSkip,
    handleSectionChange,
    handleSubsectionChange,
    handleCompleteTest,
    handleBackToExams,
    enterFullscreen,
    getQuestionStatuses,
    totalForHeader,
    submitSummary,
  };
}
