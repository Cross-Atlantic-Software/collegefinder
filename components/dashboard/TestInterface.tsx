'use client'
import { useState, useEffect } from "react";
import { Button } from "@/components/shared";
import FullscreenTestInterface from "../test/FullscreenTestInterface";

interface Question {
  id: number;
  question_text: string;
  options: Array<{key: string, text: string}>;
  marks: number;
  difficulty: string;
  subject: string;
  topic: string;
  question_type: string;
  negative_marks: number;
}

interface Exam {
  id: number;
  name: string;
  description: string;
  code: string;
}

interface TestInterfaceProps {
  exam: Exam;
  format?: Record<string, unknown>;
  onExit: () => void;
}

export default function TestInterface({ exam, format, onExit }: TestInterfaceProps) {
  // All hooks must run unconditionally (before any early return)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [testAttemptId, setTestAttemptId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [showSolution, setShowSolution] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (!format) startTest();
  }, []);

  useEffect(() => {
    if (!format) {
      const interval = setInterval(() => {
        setTimeSpent(Date.now() - questionStartTime);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [questionStartTime, format]);

  // Use fullscreen interface if format is provided (after all hooks)
  if (format) {
    return (
      <FullscreenTestInterface
        exam={exam}
        format={format}
        onExit={onExit}
      />
    );
  }

  const startTest = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/tests/exams/${exam.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setTestAttemptId(data.data.test_attempt_id);
        if (data.data.is_resume) {
          // Handle resume logic if needed
          console.log('Resuming existing test attempt');
        }
        await loadNextQuestion(data.data.test_attempt_id);
      } else {
        setError(data.message || 'Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      setError('Failed to start test. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNextQuestion = async (attemptId?: number) => {
    const currentAttemptId = attemptId || testAttemptId;
    if (!currentAttemptId) return;

    try {
      setLoading(true);
      setError(null);
      setShowSolution(false);
      setLastSubmissionResult(null);

      // For demo purposes, we'll use some default subjects and difficulties
      // In a real implementation, this would be more sophisticated
      const subjects = ['Physics', 'Chemistry', 'Mathematics'];
      const difficulties = ['easy', 'medium', 'hard'];
      const topics = ['Mechanics', 'Thermodynamics', 'Algebra', 'Calculus', 'Organic Chemistry'];
      
      const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
      const randomDifficulty = difficulties[Math.floor(Math.random() * difficulties.length)];
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      const response = await fetch(`/api/tests/attempts/${currentAttemptId}/next-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          exam_id: exam.id,
          subject: randomSubject,
          difficulty: randomDifficulty,
          topic: randomTopic,
          question_type: 'mcq'
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setCurrentQuestion(data.data.question);
        setSelectedOption("");
        setQuestionNumber(data.data.attempt_order || questionNumber);
        setQuestionStartTime(Date.now());
        setTimeSpent(0);
      } else {
        setError(data.message || 'Failed to load question');
      }
    } catch (error) {
      console.error('Error loading question:', error);
      setError('Failed to load question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!currentQuestion || !testAttemptId) return;

    try {
      setLoading(true);
      
      const timeSpentSeconds = Math.floor((Date.now() - questionStartTime) / 1000);

      const response = await fetch(`/api/tests/attempts/${testAttemptId}/questions/${currentQuestion.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          selected_option: selectedOption,
          time_spent_seconds: timeSpentSeconds
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLastSubmissionResult(data.data);
        setShowSolution(true);
      } else {
        setError(data.message || 'Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      setError('Failed to submit answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setQuestionNumber(prev => prev + 1);
    loadNextQuestion();
  };

  const handleSkip = () => {
    setQuestionNumber(prev => prev + 1);
    loadNextQuestion();
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading && !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <div className="text-white">Loading question...</div>
        </div>
      </div>
    );
  }

  if (error && !currentQuestion) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-red-400 mb-4">{error}</div>
          <Button onClick={() => startTest()} variant="themeButton">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/10 rounded-lg p-4">
        <div>
          <h2 className="text-xl font-bold text-white">{exam.name} - Practice Test</h2>
          <div className="flex items-center space-x-4 text-sm text-slate-300">
            <span>Question {questionNumber}</span>
            <span>•</span>
            <span>Time: {formatTime(timeSpent)}</span>
            {currentQuestion && (
              <>
                <span>•</span>
                <span>{currentQuestion.subject}</span>
                <span>•</span>
                <span className={`capitalize ${
                  currentQuestion.difficulty === 'easy' ? 'text-green-400' :
                  currentQuestion.difficulty === 'medium' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {currentQuestion.difficulty}
                </span>
              </>
            )}
          </div>
        </div>
        <Button onClick={onExit} variant="themeButtonOutline">
          Exit Test
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <div className="bg-white/10 rounded-lg p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex-1 pr-4">
              <h3 className="text-lg font-semibold text-white mb-2">
                {currentQuestion.question_text}
              </h3>
              {currentQuestion.topic && (
                <p className="text-sm text-slate-400 mb-4">
                  Topic: {currentQuestion.topic}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end space-y-2">
              <span className="bg-pink-600 text-white px-3 py-1 rounded text-sm">
                +{currentQuestion.marks} marks
              </span>
              {currentQuestion.negative_marks > 0 && (
                <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded text-xs">
                  -{currentQuestion.negative_marks} for wrong answer
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((option) => {
              let optionClass = `flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition border`;
              
              if (showSolution && lastSubmissionResult) {
                if (option.key === lastSubmissionResult.correct_option) {
                  optionClass += ' bg-green-600/20 border-green-600 text-green-300';
                } else if (option.key === selectedOption && option.key !== lastSubmissionResult.correct_option) {
                  optionClass += ' bg-red-600/20 border-red-600 text-red-300';
                } else {
                  optionClass += ' bg-white/5 border-white/10 text-slate-300';
                }
              } else if (selectedOption === option.key) {
                optionClass += ' bg-pink-600/20 border-pink-600 text-white';
              } else {
                optionClass += ' bg-white/5 hover:bg-white/10 border-transparent text-slate-200';
              }

              return (
                <label key={option.key} className={optionClass}>
                  <input
                    type="radio"
                    name="option"
                    value={option.key}
                    checked={selectedOption === option.key}
                    onChange={(e) => !showSolution && setSelectedOption(e.target.value)}
                    disabled={showSolution}
                    className="text-pink-600"
                  />
                  <span className="font-medium">{option.key}.</span>
                  <span className="flex-1">{option.text}</span>
                  {showSolution && option.key === lastSubmissionResult.correct_option && (
                    <span className="text-green-400">✓</span>
                  )}
                </label>
              );
            })}
          </div>

          {/* Solution */}
          {showSolution && lastSubmissionResult && (
            <div className="mt-6 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-white">Solution</h4>
                <div className="flex items-center space-x-4 text-sm">
                  <span className={`px-2 py-1 rounded ${
                    lastSubmissionResult.is_correct 
                      ? 'bg-green-600/20 text-green-300' 
                      : 'bg-red-600/20 text-red-300'
                  }`}>
                    {lastSubmissionResult.is_correct ? 'Correct' : 'Incorrect'}
                  </span>
                  <span className="text-slate-400">
                    {lastSubmissionResult.is_correct ? '+' : ''}{lastSubmissionResult.marks_awarded} marks
                  </span>
                </div>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {lastSubmissionResult.solution_text}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button 
              onClick={handleSkip}
              variant="themeButtonOutline"
              disabled={loading}
            >
              Skip
            </Button>
            
            <div className="space-x-3">
              {!showSolution ? (
                <Button
                  onClick={submitAnswer}
                  disabled={!selectedOption || loading}
                  variant="themeButton"
                >
                  {loading ? 'Submitting...' : 'Submit Answer'}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={loading}
                  variant="themeButton"
                >
                  {loading ? 'Loading...' : 'Next Question'}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}