'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  startMockTest,
  getMockQuestions,
  getSectionProgress,
  completeTest,
  getTestResults,
  ExamFormat,
} from '@/api/tests';
import type { Question, QuestionEntry, QuestionStatus, SectionProgress, TestResultsData } from '../interface/types';
import {
  buildSectionMaps,
  computeSubmitSummary,
  getNumericalAttemptedInSection,
  getNumericalRequiredForSection,
  getQuestionStatusesFromMap,
  isQuestionInNumericalSubsection,
  normalizeTestResults,
} from '../utils';
import { useFullscreenAndWarnings } from './useFullscreenAndWarnings';

export interface UseFullscreenTestProps {
  examId: number;
  format: ExamFormat;
  paperNumber?: number;
  onExit: () => void;
}

export function useFullscreenTest({ examId, format, paperNumber, onExit }: UseFullscreenTestProps) {
  const [currentSection, setCurrentSection] = useState<string>(() => Object.keys(format.sections)[0]);
  const firstSubsection = useMemo(() => {
    const firstSec = Object.keys(format.sections)[0];
    const subKeys = firstSec ? Object.keys(format.sections[firstSec]?.subsections ?? {}) : [];
    return subKeys[0] ?? 'section_a';
  }, [format.sections]);
  const [currentSubsection, setCurrentSubsection] = useState<string>(firstSubsection);
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
  const prevSectionKeyRef = useRef<{ section: string; subsection: string } | null>(null);
  sectionMapsRef.current = sectionMaps;
  currentSectionRef.current = currentSection;
  questionNumberRef.current = questionNumber;

  const {
    enterFullscreen,
    isFullscreen,
    tabChangeWarning,
    setTabChangeWarning,
    fullscreenExitWarning,
    setFullscreenExitWarning,
  } = useFullscreenAndWarnings({ testAttemptId });

  // —— Start test ——
  const startTest = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const startRes = await startMockTest(examId, paperNumber);
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
  }, [examId, format, paperNumber, enterFullscreen]);

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
      const elapsed = Math.max(0, Math.floor((Date.now() - questionViewedAtRef.current) / 1000));
      setSectionMaps((prev) => {
        const sectionMap = prev[section] || {};
        const prevEntry = sectionMap[prevNum];
        if (!prevEntry) return prev;
        const addedTime = (prevEntry.time_spent_seconds ?? 0) + elapsed;
        const updatedEntry = {
          ...prevEntry,
          time_spent_seconds: addedTime,
          ...(prevEntry.status === 'not_visited' ? { status: 'not_answered' as const } : {}),
        };
        return {
          ...prev,
          [section]: { ...sectionMap, [prevNum]: updatedEntry },
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

  // When user switches section/subsection, jump to first question of that subsection.
  // Do NOT run when sectionMaps updates (e.g. after Save & Next), or we'd reset to Q1.
  useEffect(() => {
    if (!testAttemptId || Object.keys(sectionMaps[currentSection] || {}).length === 0) return;
    const sectionKey = { section: currentSection, subsection: currentSubsection };
    const prev = prevSectionKeyRef.current;
    const sectionOrSubsectionChanged = prev === null || prev.section !== sectionKey.section || prev.subsection !== sectionKey.subsection;
    prevSectionKeyRef.current = sectionKey;
    if (sectionOrSubsectionChanged) {
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

  // Build answers array from sectionMaps in test order (sections then question numbers) for mock complete.
  const buildAnswersPayload = useCallback(
    (maps: Record<string, Record<number, QuestionEntry>>) => {
      const answers: Array<{ question_id: number; selected_option: string | null; time_spent_seconds: number }> = [];
      const sectionKeys = Object.keys(format.sections);
      const currentSec = currentSectionRef.current;
      const currentNum = questionNumberRef.current;
      const now = Date.now();
      for (const sectionKey of sectionKeys) {
        const map = maps[sectionKey];
        if (!map) continue;
        const nums = Object.keys(map)
          .map(Number)
          .filter((n) => !Number.isNaN(n))
          .sort((a, b) => a - b);
        for (const num of nums) {
          const entry = map[num];
          if (!entry?.question) continue;
          const opt = entry.savedOption;
          const selected_option =
            opt == null || opt === ''
              ? null
              : typeof opt === 'string'
                ? opt
                : JSON.stringify(opt);
          let time = entry.time_spent_seconds ?? 0;
          if (sectionKey === currentSec && num === currentNum) {
            time += Math.max(0, Math.floor((now - questionViewedAtRef.current) / 1000));
          }
          answers.push({
            question_id: entry.question.id,
            selected_option,
            time_spent_seconds: time,
          });
        }
      }
      return { answers };
    },
    [format.sections]
  );

  // —— Complete test ——
  const handleCompleteTest = useCallback(async () => {
    if (!testAttemptId) return;
    try {
      setCompletingTest(true);
      setError(null);
      const payload = buildAnswersPayload(sectionMaps);
      const completeResponse = await completeTest(testAttemptId, payload);
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
  }, [testAttemptId, onExit, sectionMaps, buildAnswersPayload]);

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

  // —— Submit answer (mock: save only in frontend state; persisted when user completes test) ——
  const handleSubmitAnswer = useCallback(() => {
    const hasAnswer = Array.isArray(selectedOption)
      ? selectedOption.length > 0
      : selectedOption !== '';
    if (!currentQuestion || !hasAnswer) return;
    const answeredNum = questionNumber;
    // JEE: block submitting another numerical if this section already has 5 numericals attempted
    const isNumerical = isQuestionInNumericalSubsection(currentSection, questionNumber, format);
    if (isNumerical) {
      const numAttempted = getNumericalAttemptedInSection(sectionMaps, currentSection, format);
      const required = getNumericalRequiredForSection(format, currentSection);
      if (numAttempted >= required) return;
    }
    setSectionMaps((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [answeredNum]: { question: currentQuestion, status: 'answered', savedOption: selectedOption },
      },
    }));
    if (answeredNum < totalQuestionsInSection) {
      loadQuestionForNumber(answeredNum + 1);
    } else {
      setCurrentQuestion(null);
      setSelectedOption(currentQuestion.question_type === 'mcq_multiple' ? [] : '');
    }
  }, [
    currentQuestion,
    selectedOption,
    questionNumber,
    currentSection,
    totalQuestionsInSection,
    loadQuestionForNumber,
    sectionMaps,
    format,
  ]);

  // —— Clear current question answer (stays on same question, frees numerical slot if applicable) ——
  const handleClearAnswer = useCallback(() => {
    if (!currentQuestion) return;
    const num = questionNumber;
    setSectionMaps((prev) => ({
      ...prev,
      [currentSection]: {
        ...prev[currentSection],
        [num]: { question: currentQuestion, status: 'not_answered', savedOption: '' },
      },
    }));
    setSelectedOption(currentQuestion.question_type === 'mcq_multiple' ? [] : '');
  }, [currentQuestion, questionNumber, currentSection]);

  // —— Next question (if option is selected, saves as "answered"; otherwise saves as "not_answered" / skip) ——
  const handleNext = useCallback(() => {
    if (!currentQuestion) return;
    const num = questionNumber;
    const hasAnswer = Array.isArray(selectedOption)
      ? selectedOption.length > 0
      : selectedOption !== '';

    if (hasAnswer) {
      // JEE: block submitting another numerical if this section already has 5 numericals attempted
      const isNumerical = isQuestionInNumericalSubsection(currentSection, questionNumber, format);
      if (isNumerical) {
        const numAttempted = getNumericalAttemptedInSection(sectionMaps, currentSection, format);
        const required = getNumericalRequiredForSection(format, currentSection);
        if (numAttempted >= required) {
          // Skip to next question without saving answer (numerical cap reached)
          if (num < totalQuestionsInSection) {
            loadQuestionForNumber(num + 1);
          } else {
            setCurrentQuestion(null);
            setSelectedOption(currentQuestion.question_type === 'mcq_multiple' ? [] : '');
          }
          return;
        }
      }

      const elapsed = Math.max(0, Math.floor((Date.now() - questionViewedAtRef.current) / 1000));
      const prevEntry = sectionMaps[currentSection]?.[num];
      const addedTime = (prevEntry?.time_spent_seconds ?? 0) + elapsed;
      // Save as answered
      setSectionMaps((prev) => ({
        ...prev,
        [currentSection]: {
          ...prev[currentSection],
          [num]: {
            question: currentQuestion,
            status: 'answered',
            savedOption: selectedOption,
            time_spent_seconds: addedTime,
          },
        },
      }));
    } else {
      const elapsed = Math.max(0, Math.floor((Date.now() - questionViewedAtRef.current) / 1000));
      const prevEntry = sectionMaps[currentSection]?.[num];
      const addedTime = (prevEntry?.time_spent_seconds ?? 0) + elapsed;
      // Save as not_answered (skip)
      setSectionMaps((prev) => ({
        ...prev,
        [currentSection]: {
          ...prev[currentSection],
          [num]: {
            question: currentQuestion,
            status: 'not_answered',
            savedOption: '',
            time_spent_seconds: addedTime,
          },
        },
      }));
    }

    // Navigate to next question
    if (num < totalQuestionsInSection) {
      loadQuestionForNumber(num + 1);
    } else {
      setCurrentQuestion(null);
      setSelectedOption(currentQuestion.question_type === 'mcq_multiple' ? [] : '');
    }
  }, [
    currentQuestion,
    selectedOption,
    questionNumber,
    currentSection,
    totalQuestionsInSection,
    loadQuestionForNumber,
    sectionMaps,
    format,
  ]);

  // —— Section / subsection change ——
  const handleSectionChange = useCallback((sectionKey: string) => {
    const section = format.sections[sectionKey];
    const firstSub = section?.subsections ? Object.keys(section.subsections)[0] : 'section_a';
    setCurrentSection(sectionKey);
    setCurrentSubsection(firstSub ?? 'section_a');
    // Don't clear currentQuestion here — let the effect load the first question of the new section
    setSelectedOption('');
  }, [format.sections]);

  const handleSubsectionChange = useCallback((subsection: string) => {
    setCurrentSubsection(subsection);
    // Don't clear currentQuestion here — let the effect load the first question of the new subsection
    setSelectedOption('');
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
  const submitSummary = useMemo(
    () => computeSubmitSummary(sectionMaps, format),
    [sectionMaps, format]
  );

  const isNumericalCapReachedForCurrentSection = useMemo(() => {
    if (!currentQuestion) return false;
    const isNumerical = isQuestionInNumericalSubsection(currentSection, questionNumber, format);
    if (!isNumerical) return false;
    const numAttempted = getNumericalAttemptedInSection(sectionMaps, currentSection, format);
    const required = getNumericalRequiredForSection(format, currentSection);
    return numAttempted >= required;
  }, [currentQuestion, currentSection, questionNumber, sectionMaps, format]);

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
    fullscreenExitWarning,
    setFullscreenExitWarning,
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
    handleNext,
    handleSectionChange,
    isNumericalCapReachedForCurrentSection,
    handleSubsectionChange,
    handleCompleteTest,
    handleBackToExams,
    enterFullscreen,
    getQuestionStatuses,
    totalForHeader,
    submitSummary,
  };
}
