'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  startMockTest,
  getMockQuestions,
  submitAnswer,
  getSectionProgress,
  completeTest,
  getTestResults,
  ExamFormat,
  MockQuestion,
} from '@/api/tests';
import type { Question, QuestionEntry, QuestionStatus, SectionProgress, TestResultsData } from '../interface/types';

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
  const [tabChangeWarning, setTabChangeWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [completingTest, setCompletingTest] = useState(false);
  const [showEndTestConfirm, setShowEndTestConfirm] = useState(false);
  const [testResults, setTestResults] = useState<TestResultsData | null>(null);

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (e) {
      console.error('Failed to enter fullscreen:', e);
    }
  }, []);

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
    } catch (e) {
      console.error('Failed to exit fullscreen:', e);
    }
  }, []);

  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [testAttemptId]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && testAttemptId) setTabChangeWarning(true);
    };
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testAttemptId) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress may be lost.';
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [testAttemptId]);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => document.removeEventListener('fullscreenchange', onFullscreen);
  }, []);

  useEffect(() => () => { exitFullscreen(); }, [exitFullscreen]);

  const buildSectionMaps = useCallback(
    (questions: MockQuestion[]): Record<string, Record<number, QuestionEntry>> => {
      const counters: Record<string, number> = {};
      const maps: Record<string, Record<number, QuestionEntry>> = {};
      const firstSection = Object.keys(format.sections)[0];
      for (const q of questions) {
        const key = q.section_name || firstSection;
        if (!maps[key]) maps[key] = {};
        if (!counters[key]) counters[key] = 0;
        counters[key]++;
        maps[key][counters[key]] = { question: q, status: 'not_visited', savedOption: '' };
      }
      return maps;
    },
    [format.sections]
  );

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
      const builtMaps = buildSectionMaps(qRes.data.questions);
      setSectionMaps(builtMaps);
      await enterFullscreen();
      const firstSection = Object.keys(format.sections)[0];
      const firstEntry = builtMaps[firstSection]?.[1];
      if (firstEntry) {
        setCurrentQuestion(firstEntry.question);
        setQuestionNumber(1);
      }
    } catch (e) {
      console.error('Error starting test:', e);
      setError('An error occurred while starting the test');
    } finally {
      setLoading(false);
    }
  }, [examId, format.sections, buildSectionMaps, enterFullscreen]);

  const totalQuestionsInSection =
    Object.keys(sectionMaps[currentSection] || {}).length ||
    Object.values(format.sections[currentSection]?.subsections ?? {}).reduce(
      (s: number, sub: { questions?: number }) => s + (sub?.questions ?? 0),
      0
    );

  const currentSectionMap = sectionMaps[currentSection] || {};

  const loadQuestionForNumber = useCallback(
    (num: number) => {
      if (num < 1) return;
      const entry = (sectionMaps[currentSection] || {})[num];
      if (entry) {
        setCurrentQuestion(entry.question);
        setSelectedOption(entry.savedOption);
        setQuestionNumber(num);
      }
    },
    [currentSection, sectionMaps]
  );

  // When section/subsection changes, show first question of that section (intentionally not deps on loadQuestionForNumber/sectionMaps to avoid running on every answer)
  useEffect(() => {
    if (testAttemptId && Object.keys(sectionMaps[currentSection] || {}).length > 0) {
      loadQuestionForNumber(1);
    }
  }, [currentSection, currentSubsection]);

  const updateProgress = useCallback(async () => {
    if (!testAttemptId) return;
    try {
      const res = await getSectionProgress(testAttemptId);
      if (res.success && res.data) setSectionProgress(res.data.section_progress);
    } catch (e) {
      console.error('Error updating progress:', e);
    }
  }, [testAttemptId]);

  const handleCompleteTest = useCallback(async () => {
    if (!testAttemptId) return;
    try {
      setCompletingTest(true);
      setError(null);
      const completeResponse = await completeTest(testAttemptId);
      const responseData = completeResponse.data ?? (completeResponse as { summary?: unknown; test_attempt?: Record<string, unknown> });
      const summary = responseData?.summary ?? responseData;

      if (completeResponse.success) {
        let question_attempts: TestResultsData['question_attempts'] = [];
        let test_attempt = (responseData as { test_attempt?: Record<string, unknown> })?.test_attempt;
        try {
          const resultsResponse = await getTestResults(testAttemptId);
          const resultsData = resultsResponse.data ?? (resultsResponse as { question_attempts?: TestResultsData['question_attempts']; test_attempt?: Record<string, unknown> });
          question_attempts = resultsData?.question_attempts ?? [];
          test_attempt = resultsData?.test_attempt ?? test_attempt;
        } catch {
          // use summary from completeResponse
        }
        const s = summary as TestResultsData['summary'] | undefined;
        const t = test_attempt as Record<string, unknown> | undefined;
        setTestResults({
          summary: s
            ? {
                total_score: (s as TestResultsData['summary']).total_score ?? 0,
                total_questions: (s as TestResultsData['summary']).total_questions ?? 0,
                attempted: (s as TestResultsData['summary']).attempted ?? 0,
                correct: (s as TestResultsData['summary']).correct ?? 0,
                incorrect: (s as TestResultsData['summary']).incorrect ?? 0,
                skipped: (s as TestResultsData['summary']).skipped ?? 0,
                accuracy: (s as TestResultsData['summary']).accuracy ?? 0,
                time_taken: (s as TestResultsData['summary']).time_taken ?? 0,
              }
            : {
                total_score: (t?.total_score as number) ?? 0,
                total_questions: 0,
                attempted: (t?.attempted_count as number) ?? 0,
                correct: (t?.correct_count as number) ?? 0,
                incorrect: (t?.incorrect_count as number) ?? 0,
                skipped: (t?.skipped_count as number) ?? 0,
                accuracy: (t?.accuracy_percentage as number) ?? 0,
                time_taken: (t?.time_spent_minutes as number) ?? 0,
              },
          question_attempts: question_attempts ?? [],
        });
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

  const handleSubmitAnswer = useCallback(async () => {
    // Check if answer is provided (handle both string and array types)
    const hasAnswer = Array.isArray(selectedOption) 
      ? selectedOption.length > 0 
      : selectedOption !== '';
    
    if (!testAttemptId || !currentQuestion || !hasAnswer) return;
    
    try {
      setLoading(true);
      setError(null);
      const response = await submitAnswer(testAttemptId, currentQuestion.id, {
        selected_option: selectedOption,
        time_spent_seconds: 30,
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

  const getQuestionStatuses = useCallback((): Record<number, QuestionStatus> => {
    const statuses: Record<number, QuestionStatus> = {};
    Object.entries(currentSectionMap).forEach(([numStr, entry]) => {
      statuses[parseInt(numStr)] = entry.status;
    });
    return statuses;
  }, [currentSectionMap]);

  const totalForHeader = Object.values(format.sections[currentSection]?.subsections ?? {}).reduce(
    (s: number, sub: { questions?: number }) => s + (sub?.questions ?? 0),
    0
  );

  return {
    // state
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
    // actions
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
  };
}
