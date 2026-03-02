'use client'
import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/shared";
import { 
  startFormatTest, 
  getSectionQuestion, 
  submitAnswer, 
  getSectionProgress,
  completeTest,
  getTestResults,
  ExamFormat 
} from "@/api/tests";
import TestRules from "./TestRules";

interface Question {
  id: number;
  question_text: string;
  options: Array<{key: string, text: string}>;
  marks: number;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  topic: string;
  question_type: 'mcq' | 'numerical';
  negative_marks: number;
  section_name?: string;
  section_type?: string;
  /** Diagram/figure image for image-based questions (e.g. JEE Physics) */
  image_url?: string | null;
}

interface FullscreenTestInterfaceProps {
  exam: {
    id: number;
    name: string;
  };
  format: ExamFormat;
  onExit: () => void;
}

interface SectionProgress {
  [key: string]: {
    name: string;
    attempted: number;
    total: number;
    correct: number;
    marks_scored: number;
    total_marks?: number;
  };
}

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered';
interface QuestionEntry {
  question: Question;
  status: QuestionStatus;
  savedOption: string;
}

export default function FullscreenTestInterface({ exam, format, onExit }: FullscreenTestInterfaceProps) {
  const [currentSection, setCurrentSection] = useState<string>(Object.keys(format.sections)[0]);
  const [currentSubsection, setCurrentSubsection] = useState<'section_a' | 'section_b'>('section_a');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [questionNumber, setQuestionNumber] = useState(0);
  // sectionMaps: per-section question cache, keyed by sectionKey then 1-based question number
  const [sectionMaps, setSectionMaps] = useState<Record<string, Record<number, QuestionEntry>>>({});
  const [testAttemptId, setTestAttemptId] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(format.duration_minutes * 60); // in seconds
  const [sectionProgress, setSectionProgress] = useState<SectionProgress>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabChangeWarning, setTabChangeWarning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [testCompleted, setTestCompleted] = useState(false);
  const [completingTest, setCompletingTest] = useState(false);
  const [showEndTestConfirm, setShowEndTestConfirm] = useState(false);
  const [testResults, setTestResults] = useState<{
    summary: { total_score: number; total_questions: number; attempted: number; correct: number; incorrect: number; skipped: number; accuracy: number; time_taken: number };
    question_attempts: Array<{
      question_text: string;
      correct_option: string;
      solution_text?: string;
      options?: Array<{ key: string; text: string }>;
      marks: number;
      subject: string;
      selected_option?: string;
      is_correct: boolean;
    }>;
  } | null>(null);

  const instructionsContainerRef = useRef<HTMLDivElement>(null);

  // Request browser fullscreen for both instructions and test (keep fullscreen for entire flow)
  useEffect(() => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  }, [testAttemptId]);

  // Tab change detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && testAttemptId) {
        setTabChangeWarning(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (testAttemptId) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your test progress may be lost.';
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [testAttemptId]);

  // Timer
  useEffect(() => {
    if (timeRemaining <= 0 || !testAttemptId) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          // Auto-submit test when time runs out
          handleCompleteTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, testAttemptId]);

  // Fullscreen handling
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Enter fullscreen only when test starts (not on instruction page)
  // Exit fullscreen when component unmounts
  useEffect(() => {
    return () => {
      exitFullscreen();
    };
  }, []);

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  };

  const startTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await startFormatTest(exam.id, format.format_id);
      if (response.success && response.data) {
        const attemptId = response.data.test_attempt_id;
        setTestAttemptId(attemptId);
        await enterFullscreen();
        await loadQuestionForNumber(1, attemptId);
      } else {
        setError(response.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError('An error occurred while starting the test');
    } finally {
      setLoading(false);
    }
  };

  const pickDifficultyFromWeightage = (): 'easy' | 'medium' | 'hard' => {
    const weightage = (format as any).difficulty_weightage;
    if (!weightage || typeof weightage !== 'object') return 'medium';

    const easy = Math.max(0, Number(weightage.easy) || 0);
    const medium = Math.max(0, Number(weightage.medium) || 0);
    const hard = Math.max(0, Number(weightage.hard) || 0);
    const total = easy + medium + hard;
    if (total <= 0) return 'medium';

    const r = Math.random() * total;
    if (r < easy) return 'easy';
    if (r < easy + medium) return 'medium';
    return 'hard';
  };

  // Total questions in the currently active section
  const totalQuestionsInSection = Object.values(format.sections[currentSection]?.subsections ?? {})
    .reduce((s: number, sub: any) => s + (sub?.questions ?? 0), 0);

  // Current section's question map
  const currentSectionMap = sectionMaps[currentSection] || {};

  /** Load question for a specific 1-based number. If cached, restore it; otherwise fetch from server. */
  const loadQuestionForNumber = async (num: number, attemptId?: number) => {
    const idToUse = attemptId ?? testAttemptId;
    if (!idToUse || num < 1 || num > totalQuestionsInSection) return;

    // Restore cached question
    const cached = (sectionMaps[currentSection] || {})[num];
    if (cached) {
      setCurrentQuestion(cached.question);
      setSelectedOption(cached.savedOption);
      setQuestionNumber(num);
      return;
    }

    // Fetch new question from server — update UI immediately so palette and main area reflect the clicked question
    setQuestionNumber(num);
    setCurrentQuestion(null);
    setSelectedOption('');
    try {
      setLoading(true);
      setError(null);

      const sectionConfig = format.sections[currentSection];
      const subsections = sectionConfig.subsections || {};
      const subsectionKey = subsections[currentSubsection] ? currentSubsection : (Object.keys(subsections)[0] as 'section_a' | 'section_b');
      const subsectionConfig = subsections[subsectionKey];
      const difficulty = pickDifficultyFromWeightage();

      const response = await getSectionQuestion(idToUse, currentSection, {
        exam_id: exam.id,
        subject: sectionConfig.name,
        difficulty,
        section_type: subsectionConfig?.type || 'MCQ',
        question_type: (subsectionConfig?.type === 'Numerical' ? 'numerical' : 'mcq') as 'mcq' | 'numerical'
      });

      if (response.success && response.data) {
        const q = response.data.question;
        setSectionMaps(prev => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [num]: { question: q, status: 'not_answered', savedOption: '' }
          }
        }));
        setCurrentQuestion(q);
        setQuestionNumber(num);
        await updateProgress();
      } else {
        setError(response.message || 'Failed to load question');
      }
    } catch (err) {
      console.error('Error loading question:', err);
      setError('An error occurred while loading the question');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load question 1 when test starts or section changes
  useEffect(() => {
    if (testAttemptId && !currentQuestion && !loading) {
      loadQuestionForNumber(1);
    }
  }, [testAttemptId, currentSection, currentSubsection]);

  const handleSubmitAnswer = async () => {
    if (!testAttemptId || !currentQuestion || !selectedOption) return;

    try {
      setLoading(true);
      setError(null);

      const response = await submitAnswer(testAttemptId, currentQuestion.id, {
        selected_option: selectedOption,
        time_spent_seconds: 30
      });

      if (response.success) {
        // Mark this question as answered in the palette map
        const answeredNum = questionNumber;
        setSectionMaps(prev => ({
          ...prev,
          [currentSection]: {
            ...prev[currentSection],
            [answeredNum]: { question: currentQuestion, status: 'answered', savedOption: selectedOption }
          }
        }));
        await updateProgress();
        setCurrentQuestion(null);
        setSelectedOption('');
        // Move to next question in sequence
        if (answeredNum < totalQuestionsInSection) {
          await loadQuestionForNumber(answeredNum + 1);
        }
      } else {
        setError(response.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('An error occurred while submitting the answer');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    if (currentQuestion) {
      // Mark as not_answered (seen but skipped)
      const skippedNum = questionNumber;
      setSectionMaps(prev => ({
        ...prev,
        [currentSection]: {
          ...prev[currentSection],
          [skippedNum]: { question: currentQuestion, status: 'not_answered', savedOption: '' }
        }
      }));
      setCurrentQuestion(null);
      setSelectedOption('');
      if (skippedNum < totalQuestionsInSection) {
        await loadQuestionForNumber(skippedNum + 1);
      }
    }
  };

  const updateProgress = async () => {
    if (!testAttemptId) return;

    try {
      const response = await getSectionProgress(testAttemptId);
      if (response.success && response.data) {
        setSectionProgress(response.data.section_progress);
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const handleSectionChange = (sectionKey: string) => {
    const section = format.sections[sectionKey];
    const firstSubsection = section?.subsections ? (Object.keys(section.subsections)[0] as 'section_a' | 'section_b') : 'section_a';
    setCurrentSection(sectionKey);
    setCurrentSubsection(firstSubsection);
    setCurrentQuestion(null);
    setSelectedOption('');
    setQuestionNumber(0);
    // sectionMaps is preserved so the user can return to this section and see cached questions
  };

  const handleSubsectionChange = (subsection: 'section_a' | 'section_b') => {
    setCurrentSubsection(subsection);
    setCurrentQuestion(null);
    setSelectedOption('');
    setQuestionNumber(0);
  };

  const handleCompleteTest = async () => {
    if (!testAttemptId) return;

    try {
      setCompletingTest(true);
      setError(null);
      const completeResponse = await completeTest(testAttemptId);
      const responseData = completeResponse.data ?? (completeResponse as any);
      const summary = responseData?.summary ?? responseData;

      if (completeResponse.success) {
        let question_attempts: any[] = [];
        let test_attempt = responseData?.test_attempt;
        try {
          const resultsResponse = await getTestResults(testAttemptId);
          const resultsData = resultsResponse.data ?? (resultsResponse as any);
          question_attempts = resultsData?.question_attempts ?? [];
          test_attempt = resultsData?.test_attempt ?? test_attempt;
        } catch (_) {
          // Use summary from completeResponse if getTestResults fails
        }
        const s = summary;
        setTestResults({
            summary: s ? {
              total_score: s.total_score ?? 0,
              total_questions: s.total_questions ?? 0,
              attempted: s.attempted ?? 0,
              correct: s.correct ?? 0,
              incorrect: s.incorrect ?? 0,
              skipped: s.skipped ?? 0,
              accuracy: s.accuracy ?? 0,
              time_taken: s.time_taken ?? 0
            } : {
              total_score: test_attempt?.total_score ?? 0,
              total_questions: 0,
              attempted: test_attempt?.attempted_count ?? 0,
              correct: test_attempt?.correct_count ?? 0,
              incorrect: test_attempt?.incorrect_count ?? 0,
              skipped: test_attempt?.skipped_count ?? 0,
              accuracy: test_attempt?.accuracy_percentage ?? 0,
              time_taken: test_attempt?.time_spent_minutes ?? 0
            },
            question_attempts: question_attempts ?? []
          });
        setTestCompleted(true);
      } else {
        setError(completeResponse.message || 'Failed to complete test.');
        onExit();
      }
    } catch (error) {
      console.error('Error completing test:', error);
      setError('Failed to complete test. Returning to exams.');
      onExit();
    } finally {
      setCompletingTest(false);
      setShowEndTestConfirm(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Portal wrapper - renders outside dashboard to overlay sidebar/header
  const fullscreenOverlay = (content: ReactNode): ReactNode => {
    if (typeof document === 'undefined') return content;
    return createPortal(content, document.body);
  };

  // Tab change warning modal
  if (tabChangeWarning) {
    return fullscreenOverlay(
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg p-6 max-w-md mx-4">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Tab Switch Detected!</h3>
            <p className="text-gray-600 mb-4">
              You switched tabs or left the test window. This action has been logged. 
              Please stay focused on the test to avoid any issues.
            </p>
            <Button
              onClick={() => setTabChangeWarning(false)}
              variant="themeButton"
              className="w-full"
            >
              Continue Test
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Instruction page - standalone fullscreen overlay (browser fullscreen when shown)
  if (!testAttemptId) {
    const formatRules = {
      format,
      rules: format.rules || [],
      marking_scheme: format.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
      sections: format.sections || {}
    };

    const handleBackFromInstructions = () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
      onExit();
    };

    return fullscreenOverlay(
      <div
        ref={instructionsContainerRef}
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto"
      >
        <div className="min-h-full flex flex-col items-center py-8 px-4">
          <TestRules
            examName={exam.name}
            formatRules={formatRules}
            onStartTest={startTest}
            onBack={handleBackFromInstructions}
            backLabel="Back to Exams"
            loading={loading}
          />
          {error && (
            <div className="mt-4 w-full max-w-4xl">
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm">
                {error}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Results screen - shown after test completion
  if (testCompleted && testResults) {
    const { summary, question_attempts } = testResults;

    return fullscreenOverlay(
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
        <div className="min-h-full py-8 px-4 max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-white mb-6">Test Results - {exam.name}</h1>

          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{summary.total_score}</div>
              <div className="text-sm text-slate-400">Total Score</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{summary.correct}/{summary.attempted}</div>
              <div className="text-sm text-slate-400">Correct</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{summary.accuracy}%</div>
              <div className="text-sm text-slate-400">Accuracy</div>
            </div>
            <div className="bg-white/10 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-pink-400">{summary.time_taken}m</div>
              <div className="text-sm text-slate-400">Time Taken</div>
            </div>
          </div>

          {/* Question-wise results with answers and solutions */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Question-wise Review</h2>
            {question_attempts.map((qa: any, idx: number) => (
              <div key={idx} className="bg-white/10 rounded-lg p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm bg-pink-600/20 text-pink-300 px-2 py-1 rounded">Q{idx + 1}</span>
                  <span className="text-sm text-slate-400">{qa.subject}</span>
                  {qa.is_correct ? (
                    <span className="text-sm text-green-400">✓ Correct</span>
                  ) : (
                    <span className="text-sm text-red-400">✗ Incorrect</span>
                  )}
                </div>
                <p className="text-white">{qa.question_text}</p>
                {qa.selected_option != null && (
                  <p className="text-slate-400">Your answer: <span className={qa.is_correct ? 'text-green-400' : 'text-red-400'}>{qa.selected_option}</span></p>
                )}
                <p className="text-slate-300">Correct answer: <span className="text-pink-400">{qa.correct_option}</span></p>
                {qa.solution_text && (
                  <div>
                    <p className="text-sm font-medium text-slate-300 mb-1">Solution:</p>
                    <p className="text-slate-200 text-sm leading-relaxed">{qa.solution_text}</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <Button onClick={onExit} variant="themeButton" size="lg">
              Back to Exams
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleBackToExams = () => {
    setShowEndTestConfirm(false);
    setError(null);
    onExit();
  };

  // End Test confirmation modal
  if (showEndTestConfirm) {
    return fullscreenOverlay(
      <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-2">End Test?</h3>
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to end the test? Your submitted answers will be saved and you will see your results.
          </p>
          {error && (
            <p className="text-red-400 text-sm mb-4">{error}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-between">
            <Button
              onClick={handleBackToExams}
              variant="themeButtonOutline"
              disabled={completingTest}
            >
              Back to Exams
            </Button>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowEndTestConfirm(false)}
                variant="themeButtonOutline"
                disabled={completingTest}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompleteTest}
                variant="themeButton"
                disabled={completingTest}
                className="bg-red-600 hover:bg-red-700"
              >
                {completingTest ? 'Ending...' : 'Yes, End Test'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main test interface - mock test in fullscreen overlay
  return fullscreenOverlay(
    <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800 border-b border-slate-700 p-4">
        {error && (
          <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-sm">
            {error}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white">{exam.name} - {format.name}</h1>
            {currentQuestion && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-700/80 border border-slate-600">
                <span className="text-slate-400 text-sm">Question</span>
                <span className="text-white font-semibold tabular-nums">
                  {questionNumber}
                </span>
                <span className="text-slate-500 text-sm">of</span>
                <span className="text-slate-300 font-medium tabular-nums">
                  {Object.values(format.sections[currentSection]?.subsections ?? {}).reduce((s: number, sub: any) => s + (sub?.questions ?? 0), 0)}
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToExams}
              size="sm"
              variant="themeButtonOutline"
              disabled={completingTest}
            >
              Back to Exams
            </Button>
            <div className="text-sm text-slate-400">
              Time Remaining: <span className="text-pink-400 font-mono">{formatTime(timeRemaining)}</span>
            </div>
            
            {!isFullscreen && (
              <Button onClick={enterFullscreen} size="sm" variant="themeButtonOutline">
                Enter Fullscreen
              </Button>
            )}
            
            <Button
              onClick={() => setShowEndTestConfirm(true)}
              size="sm"
              variant="themeButton"
              disabled={completingTest}
              className="bg-red-600 hover:bg-red-700"
            >
              {completingTest ? 'Ending...' : 'End Test'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar — Section Navigation */}
        <div className="w-56 bg-slate-800/95 border-r border-slate-700 flex flex-col overflow-y-auto shrink-0">
          <div className="px-4 py-3.5 border-b border-slate-700/80">
            <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Sections</h3>
          </div>
          <div className="p-2.5 flex-1 space-y-3">
            {Object.entries(format.sections).map(([sectionKey, section]: [string, any]) => {
              const total = Object.values(section.subsections).reduce((s: number, sub: any) => s + sub.questions, 0);
              const attempted = sectionProgress[sectionKey]?.attempted || 0;
              const progressPct = total > 0 ? Math.round((attempted / total) * 100) : 0;
              const isActive = currentSection === sectionKey;
              return (
                <div key={sectionKey} className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-800/50">
                  <button
                    onClick={() => handleSectionChange(sectionKey)}
                    className={`w-full text-left px-3.5 py-3 rounded-t-lg transition-all duration-150 text-sm border-l-2 ${
                      isActive
                        ? 'bg-pink-600/20 text-white border-pink-500'
                        : 'text-slate-300 hover:bg-slate-700/70 border-transparent hover:border-slate-600'
                    }`}
                  >
                    <div className="font-semibold text-slate-200">{section.name}</div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-pink-500/80 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-500 tabular-nums shrink-0">{attempted}/{total}</span>
                    </div>
                  </button>
                  {isActive && Object.entries(section.subsections).map(([subKey, subsection]: [string, any]) => (
                    <button
                      key={subKey}
                      onClick={() => handleSubsectionChange(subKey as 'section_a' | 'section_b')}
                      className={`w-full text-left pl-4 pr-3 py-2.5 first:border-t first:border-slate-700/50 text-xs transition last:rounded-b-lg ${
                        currentSubsection === subKey
                          ? 'bg-pink-500/25 text-pink-300 font-medium'
                          : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'
                      }`}
                    >
                      <span className="text-slate-500 font-normal">Sec {subKey.split('_')[1]?.toUpperCase()}</span>
                      <span className="mx-1.5 text-slate-600">·</span>
                      {subsection.type}
                      <span className="ml-1 text-slate-500">{subsection.questions}Q</span>
                    </button>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Center — Question Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {currentQuestion ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-3xl mx-auto space-y-5">
                {/* Question meta */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs font-semibold bg-pink-600/20 text-pink-300 px-2.5 py-1 rounded-full">
                    {currentQuestion.subject}
                  </span>
                  <span className="text-xs bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full capitalize">
                    {currentQuestion.difficulty}
                  </span>
                  <span className="text-xs text-slate-400">
                    +{currentQuestion.marks} marks · -{currentQuestion.negative_marks} neg
                  </span>
                  {currentSectionMap[questionNumber]?.status === 'answered' && (
                    <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">✓ Answered</span>
                  )}
                  {currentSectionMap[questionNumber]?.status === 'not_answered' && (
                    <span className="text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">Skipped</span>
                  )}
                </div>

                {/* Diagram image */}
                {currentQuestion.image_url && (
                  <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
                    <img src={currentQuestion.image_url} alt="Question diagram" className="w-full max-h-72 object-contain" />
                  </div>
                )}

                {/* Question text */}
                <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
                  <p className="text-white text-base leading-relaxed">{currentQuestion.question_text}</p>
                </div>

                {/* Options / Numerical */}
                {currentQuestion.question_type === 'mcq' ? (
                  <div className="space-y-2.5">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.key}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition select-none ${
                          selectedOption === option.key
                            ? 'border-pink-500 bg-pink-500/10'
                            : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
                        }`}
                      >
                        <input type="radio" name="answer" value={option.key} checked={selectedOption === option.key}
                          onChange={(e) => setSelectedOption(e.target.value)} className="sr-only" />
                        <div className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                          selectedOption === option.key ? 'border-pink-500 bg-pink-500 text-white' : 'border-slate-500 text-slate-400'
                        }`}>{option.key}</div>
                        <span className="text-white text-sm leading-relaxed">{option.text}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-300">Enter numerical answer (0–9999):</label>
                    <input type="number" min="0" max="9999" value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-xl text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      placeholder="Enter answer..." />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                  <div className="flex gap-2">
                    {questionNumber > 1 && (
                      <Button onClick={() => loadQuestionForNumber(questionNumber - 1)} variant="themeButtonOutline" disabled={loading} size="sm">
                        ← Prev
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSkip} variant="themeButtonOutline" disabled={loading} size="sm">
                      Skip →
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      variant="themeButton"
                      disabled={!selectedOption || loading || currentSectionMap[questionNumber]?.status === 'answered'}
                      size="sm"
                    >
                      {loading ? 'Saving…' : currentSectionMap[questionNumber]?.status === 'answered' ? 'Answered ✓' : 'Save & Next →'}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
                    <p className="text-slate-300">Question loading</p>
                  </>
                ) : error ? (
                  <>
                    <div className="text-red-400 mb-4">{error}</div>
                    <Button onClick={() => loadQuestionForNumber(questionNumber || 1)} variant="themeButton">Retry</Button>
                  </>
                ) : (
                  <div className="text-slate-400 text-sm">Select a section to begin</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar — Question Palette */}
        <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
          <div className="p-3 border-b border-slate-700">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question Palette</h3>
          </div>

          {/* Legend with counts */}
          {(() => {
            const answeredCount = Object.values(currentSectionMap).filter(e => e.status === 'answered').length;
            const notAnsweredCount = Object.values(currentSectionMap).filter(e => e.status === 'not_answered').length;
            const notVisitedCount = totalQuestionsInSection - Object.keys(currentSectionMap).length;
            return (
              <div className="px-3 py-2.5 border-b border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-slate-600 border border-slate-500 shrink-0" />
                    Not Visited
                  </div>
                  <span className="text-slate-300 font-medium tabular-nums">{notVisitedCount}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-red-600 shrink-0" />
                    Not Answered
                  </div>
                  <span className="text-red-400 font-medium tabular-nums">{notAnsweredCount}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-green-600 shrink-0" />
                    Answered
                  </div>
                  <span className="text-green-400 font-medium tabular-nums">{answeredCount}</span>
                </div>
              </div>
            );
          })()}

          {/* Question number grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: totalQuestionsInSection }, (_, i) => i + 1).map((num) => {
                const entry = currentSectionMap[num];
                const status: QuestionStatus = entry ? entry.status : 'not_visited';
                const isCurrent = num === questionNumber;
                return (
                  <button
                    key={num}
                    onClick={() => loadQuestionForNumber(num)}
                    disabled={loading}
                    title={`Question ${num}: ${status.replace('_', ' ')}`}
                    className={[
                      'w-full aspect-square rounded text-xs font-semibold transition',
                      isCurrent ? 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-800' : '',
                      status === 'not_visited' ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : '',
                      status === 'not_answered' ? 'bg-red-600 hover:bg-red-500 text-white' : '',
                      status === 'answered' ? 'bg-green-600 hover:bg-green-500 text-white' : '',
                    ].join(' ')}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Counts summary */}
          <div className="p-3 border-t border-slate-700 space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Answered</span>
              <span className="text-green-400 font-semibold">
                {Object.values(currentSectionMap).filter(e => e.status === 'answered').length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Not Answered</span>
              <span className="text-red-400 font-semibold">
                {Object.values(currentSectionMap).filter(e => e.status === 'not_answered').length}
              </span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Not Visited</span>
              <span className="text-slate-300 font-semibold">
                {totalQuestionsInSection - Object.keys(currentSectionMap).length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}