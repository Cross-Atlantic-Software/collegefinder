'use client'
import { useState, useEffect, useCallback, type ReactNode } from "react";
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

export default function FullscreenTestInterface({ exam, format, onExit }: FullscreenTestInterfaceProps) {
  const [currentSection, setCurrentSection] = useState<string>(Object.keys(format.sections)[0]);
  const [currentSubsection, setCurrentSubsection] = useState<'section_a' | 'section_b'>('section_a');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [testAttemptId, setTestAttemptId] = useState<number | null>(null);
  const [questionNumber, setQuestionNumber] = useState(1);
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
        await loadNextQuestion(attemptId);
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

  const loadNextQuestion = async (attemptId?: number) => {
    const idToUse = attemptId ?? testAttemptId;
    if (!idToUse) return;

    try {
      setLoading(true);
      setError(null);
      setSelectedOption('');

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
        setCurrentQuestion(response.data.question);
        await updateProgress();
      } else {
        setError(response.message || 'Failed to load question');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      setError('An error occurred while loading the question');
    } finally {
      setLoading(false);
    }
  };

  // Auto-load first question when test starts or section changes
  useEffect(() => {
    if (testAttemptId && !currentQuestion && !loading) {
      loadNextQuestion();
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
        await updateProgress();
        setCurrentQuestion(null);
        setSelectedOption('');
        await loadNextQuestion();
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
  };

  const handleSubsectionChange = (subsection: 'section_a' | 'section_b') => {
    setCurrentSubsection(subsection);
    setCurrentQuestion(null);
    setSelectedOption('');
  };

  const handleCompleteTest = async () => {
    if (!testAttemptId) return;

    try {
      setCompletingTest(true);
      setLoading(true);
      setError(null);
      const completeResponse = await completeTest(testAttemptId);
      if (completeResponse.success && completeResponse.data) {
        const s = completeResponse.data.summary;
        const summaryFromComplete = s ? {
          total_score: s.total_score ?? 0,
          total_questions: s.total_questions ?? 0,
          attempted: s.attempted ?? 0,
          correct: s.correct ?? 0,
          incorrect: s.incorrect ?? 0,
          skipped: s.skipped ?? 0,
          accuracy: s.accuracy ?? 0,
          time_taken: s.time_taken ?? 0
        } : null;

        const ta = completeResponse.data.test_attempt;
        const summaryFromAttempt = ta ? {
          total_score: ta.total_score ?? 0,
          total_questions: 0,
          attempted: ta.attempted_count ?? 0,
          correct: ta.correct_count ?? 0,
          incorrect: ta.incorrect_count ?? 0,
          skipped: ta.skipped_count ?? 0,
          accuracy: ta.accuracy_percentage ?? 0,
          time_taken: ta.time_spent_minutes ?? 0
        } : null;

        const summary = summaryFromComplete ?? summaryFromAttempt ?? {
          total_score: 0, total_questions: 0, attempted: 0, correct: 0,
          incorrect: 0, skipped: 0, accuracy: 0, time_taken: 0
        };

        let questionAttempts: any[] = [];
        const resultsResponse = await getTestResults(testAttemptId);
        if (resultsResponse.success && resultsResponse.data?.question_attempts) {
          questionAttempts = resultsResponse.data.question_attempts;
        }

        setTestResults({
          summary,
          question_attempts: questionAttempts
        });
        setTestCompleted(true);
      } else {
        setError(completeResponse.message || 'Failed to complete test. You can leave the test using "Back to Exams" below.');
      }
    } catch (error) {
      console.error('Error completing test:', error);
      setError('Failed to complete test. You can leave the test using "Back to Exams" below.');
    } finally {
      setLoading(false);
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

  // Instruction page - standalone fullscreen overlay (no sidebar/header)
  if (!testAttemptId) {
    const formatRules = {
      format,
      rules: format.rules || [],
      marking_scheme: format.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 },
      sections: format.sections || {}
    };

    return fullscreenOverlay(
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
        <div className="min-h-full flex flex-col items-center py-8 px-4">
          <TestRules
            examName={exam.name}
            formatRules={formatRules}
            onStartTest={startTest}
            onBack={onExit}
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

  // End Test confirmation modal
  if (showEndTestConfirm) {
    return fullscreenOverlay(
      <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
        <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-600">
          <h3 className="text-lg font-semibold text-white mb-2">End Test?</h3>
          <p className="text-slate-300 text-sm mb-6">
            Are you sure you want to end the test? Your submitted answers will be saved and you will see your results.
          </p>
          <div className="flex flex-col gap-3">
            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}
            <div className="flex gap-3 justify-between">
              <Button
                onClick={onExit}
                variant="themeButtonOutline"
                disabled={completingTest}
              >
                Back to Exams (leave test)
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
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-white">{exam.name} - {format.name}</h1>
            <div className="text-sm text-slate-400">
              Question {questionNumber}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-slate-400">
              Time Remaining: <span className="text-pink-400 font-mono">{formatTime(timeRemaining)}</span>
            </div>
            
            {!isFullscreen && (
              <Button onClick={enterFullscreen} size="sm" variant="themeButtonOutline">
                Enter Fullscreen
              </Button>
            )}
            
            <Button
              onClick={onExit}
              size="sm"
              variant="themeButtonOutline"
            >
              Back to Exams
            </Button>
            
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
        {/* Section Navigation Sidebar */}
        <div className="w-80 bg-slate-800 border-r border-slate-700 p-4 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Sections</h3>
            
            {Object.entries(format.sections).map(([sectionKey, section]: [string, any]) => (
              <div key={sectionKey} className="space-y-2">
                <button
                  onClick={() => handleSectionChange(sectionKey)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    currentSection === sectionKey 
                      ? 'bg-pink-600 text-white' 
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <div className="font-medium">{section.name}</div>
                  <div className="text-sm opacity-75">
                    {sectionProgress[sectionKey]?.attempted || 0} / {
                      Object.values(section.subsections).reduce((sum: number, sub: any) => sum + sub.questions, 0)
                    } attempted
                  </div>
                </button>
                
                {currentSection === sectionKey && (
                  <div className="ml-4 space-y-1">
                    {Object.entries(section.subsections).map(([subKey, subsection]: [string, any]) => (
                      <button
                        key={subKey}
                        onClick={() => handleSubsectionChange(subKey as 'section_a' | 'section_b')}
                        className={`w-full text-left p-2 rounded text-sm transition ${
                          currentSubsection === subKey
                            ? 'bg-pink-500 text-white'
                            : 'bg-slate-600 text-slate-300 hover:bg-slate-500'
                        }`}
                      >
                        Section {subKey.split('_')[1]?.toUpperCase()} ({subsection.type})
                        <div className="text-xs opacity-75">{subsection.questions} questions</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {currentQuestion ? (
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm bg-pink-600/20 text-pink-300 px-3 py-1 rounded">
                      {currentQuestion.subject}
                    </span>
                    <span className="text-sm bg-blue-600/20 text-blue-300 px-3 py-1 rounded">
                      {currentQuestion.difficulty}
                    </span>
                    <span className="text-sm text-slate-400">
                      +{currentQuestion.marks} marks
                    </span>
                  </div>
                </div>

                {/* Question Text */}
                <div className="bg-white/10 rounded-lg p-6">
                  <div className="text-white text-lg leading-relaxed">
                    {currentQuestion.question_text}
                  </div>
                </div>

                {/* Options or Numerical Input */}
                {currentQuestion.question_type === 'mcq' ? (
                  <div className="space-y-3">
                    {currentQuestion.options.map((option) => (
                      <label
                        key={option.key}
                        className={`block p-4 rounded-lg border-2 cursor-pointer transition ${
                          selectedOption === option.key
                            ? 'border-pink-500 bg-pink-500/10'
                            : 'border-slate-600 bg-slate-800 hover:border-slate-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="answer"
                          value={option.key}
                          checked={selectedOption === option.key}
                          onChange={(e) => setSelectedOption(e.target.value)}
                          className="sr-only"
                        />
                        <div className="flex items-center space-x-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            selectedOption === option.key
                              ? 'border-pink-500 bg-pink-500'
                              : 'border-slate-500'
                          }`}>
                            {selectedOption === option.key && (
                              <div className="w-2 h-2 bg-white rounded-full shrink-0"></div>
                            )}
                          </div>
                          <span className="font-medium text-slate-300">{option.key}.</span>
                          <span className="text-white">{option.text}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-slate-300">
                      Enter your numerical answer (0-9999):
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="9999"
                      value={selectedOption}
                      onChange={(e) => setSelectedOption(e.target.value)}
                      className="w-full p-3 bg-slate-800 border border-slate-600 rounded-lg text-white focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
                      placeholder="Enter answer..."
                    />
                  </div>
                )}

                {/* Action Buttons - no answer shown until test complete */}
                <div className="flex justify-between items-center pt-4">
                  <Button
                    onClick={() => setCurrentQuestion(null)}
                    variant="themeButtonOutline"
                    disabled={loading}
                  >
                    Back to Sections
                  </Button>
                  
                  <div className="space-x-3">
                    <Button
                      onClick={() => { setCurrentQuestion(null); setSelectedOption(''); loadNextQuestion(); }}
                      variant="themeButtonOutline"
                      disabled={loading}
                    >
                      Skip
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      variant="themeButton"
                      disabled={!selectedOption || loading}
                    >
                      {loading ? 'Submitting...' : 'Submit & Next'}
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
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
                    <p className="text-slate-300">Loading question...</p>
                    <p className="text-sm text-slate-500">Using saved questions first, then generating if needed</p>
                  </>
                ) : error ? (
                  <>
                    <div className="text-red-400 mb-4">{error}</div>
                    <Button onClick={() => loadNextQuestion()} variant="themeButton">
                      Retry
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="text-slate-400">
                      <div className="w-16 h-16 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium mb-2">Select a section to begin</p>
                      <p className="text-sm">Choose a section from the sidebar to start answering questions</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}