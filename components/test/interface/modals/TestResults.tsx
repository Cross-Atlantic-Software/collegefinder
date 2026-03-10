'use client'
import { useState, useMemo } from 'react';
import { Button } from '@/components/shared';

interface QuestionAttempt {
  question_text: string;
  correct_option: string;
  solution_text?: string;
  options?: Array<{ key: string; text: string }>;
  marks: number;
  subject: string;
  selected_option?: string;
  is_correct: boolean;
}

interface TestResultsProps {
  examName: string;
  summary: {
    total_score: number;
    total_questions: number;
    attempted: number;
    correct: number;
    incorrect: number;
    skipped: number;
    accuracy: number;
    time_taken: number;
  };
  questionAttempts: QuestionAttempt[];
  onExit: () => void;
}

function getQuestionStatus(qa: QuestionAttempt): 'right' | 'wrong' | 'skipped' {
  const attempted = qa.selected_option != null && qa.selected_option !== '';
  if (!attempted) return 'skipped';
  return qa.is_correct ? 'right' : 'wrong';
}

export default function TestResults({ examName, summary, questionAttempts, onExit }: TestResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const { attempted, right, wrong, skipped } = useMemo(() => {
    const attempted: number[] = [];
    const right: number[] = [];
    const wrong: number[] = [];
    const skipped: number[] = [];
    questionAttempts.forEach((qa, idx) => {
      const num = idx + 1;
      const status = getQuestionStatus(qa);
      if (status === 'right') {
        right.push(num);
        attempted.push(num);
      } else if (status === 'wrong') {
        wrong.push(num);
        attempted.push(num);
      } else {
        skipped.push(num);
      }
    });
    return { attempted, right, wrong, skipped };
  }, [questionAttempts]);

  const selectedQa = selectedIndex != null ? questionAttempts[selectedIndex] : null;

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-900 overflow-y-auto">
      <div className="min-h-full py-8 px-4 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Test Results - {examName}</h1>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-pink-400">{summary.total_score}</div>
            <div className="text-sm text-slate-400">Total Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-pink-400">{summary.correct}/{summary.attempted}</div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-pink-400">{summary.accuracy}%</div>
            <div className="text-sm text-slate-400">Accuracy</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-xl p-4 text-center border border-white/5">
            <div className="text-2xl font-bold text-pink-400">{summary.time_taken}m</div>
            <div className="text-sm text-slate-400">Time Taken</div>
          </div>
        </div>

        {/* Bifurcation: Attempted, Right, Wrong, Skipped with question numbers */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Question-wise Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
              <div className="text-sm font-medium text-blue-400 mb-2">Attempted ({attempted.length})</div>
              <div className="flex flex-wrap gap-2">
                {attempted.length === 0 ? (
                  <span className="text-slate-500 text-sm">—</span>
                ) : (
                  attempted.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedIndex(num - 1)}
                      className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition ${selectedIndex === num - 1 ? 'bg-blue-500 text-white ring-2 ring-blue-400' : 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'}`}
                    >
                      Q{num}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/20">
              <div className="text-sm font-medium text-green-400 mb-2">Right ({right.length})</div>
              <div className="flex flex-wrap gap-2">
                {right.length === 0 ? (
                  <span className="text-slate-500 text-sm">—</span>
                ) : (
                  right.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedIndex(num - 1)}
                      className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition ${selectedIndex === num - 1 ? 'bg-green-500 text-white ring-2 ring-green-400' : 'bg-green-500/20 text-green-300 hover:bg-green-500/30'}`}
                    >
                      Q{num}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
              <div className="text-sm font-medium text-red-400 mb-2">Wrong ({wrong.length})</div>
              <div className="flex flex-wrap gap-2">
                {wrong.length === 0 ? (
                  <span className="text-slate-500 text-sm">—</span>
                ) : (
                  wrong.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedIndex(num - 1)}
                      className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition ${selectedIndex === num - 1 ? 'bg-red-500 text-white ring-2 ring-red-400' : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'}`}
                    >
                      Q{num}
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="bg-slate-500/10 rounded-xl p-4 border border-slate-500/20">
              <div className="text-sm font-medium text-slate-400 mb-2">Skipped ({skipped.length})</div>
              <div className="flex flex-wrap gap-2">
                {skipped.length === 0 ? (
                  <span className="text-slate-500 text-sm">—</span>
                ) : (
                  skipped.map((num) => (
                    <button
                      key={num}
                      onClick={() => setSelectedIndex(num - 1)}
                      className={`min-w-[2rem] h-8 px-2 rounded-lg text-sm font-medium transition ${selectedIndex === num - 1 ? 'bg-slate-500 text-white ring-2 ring-slate-400' : 'bg-slate-500/20 text-slate-300 hover:bg-slate-500/30'}`}
                    >
                      Q{num}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Question-wise review: click to show details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Question-wise Review</h2>
          <p className="text-slate-400 text-sm mb-4">Click a question number above or below to view details.</p>

          {/* Compact list of all questions - clickable */}
          <div className="flex flex-wrap gap-2 mb-6">
            {questionAttempts.map((qa, idx) => {
              const num = idx + 1;
              const status = getQuestionStatus(qa);
              const isSelected = selectedIndex === idx;
              const style = status === 'right' ? 'bg-green-500/20 text-green-300 border-green-500/30' : status === 'wrong' ? 'bg-red-500/20 text-red-300 border-red-500/30' : 'bg-slate-500/20 text-slate-400 border-slate-500/30';
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`min-w-[2.5rem] h-9 px-2 rounded-lg text-sm font-medium border transition hover:opacity-90 ${isSelected ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-900' : ''} ${style}`}
                >
                  Q{num}
                </button>
              );
            })}
          </div>

          {/* Detail panel for selected question */}
          {selectedQa ? (
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/10 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm bg-pink-600/20 text-pink-300 px-2.5 py-1 rounded-lg font-medium">
                  Q{selectedIndex! + 1}
                </span>
                <span className="text-sm text-slate-400">{selectedQa.subject}</span>
                {getQuestionStatus(selectedQa) === 'right' && (
                  <span className="text-sm text-green-400 font-medium">✓ Correct</span>
                )}
                {getQuestionStatus(selectedQa) === 'wrong' && (
                  <span className="text-sm text-red-400 font-medium">✗ Incorrect</span>
                )}
                {getQuestionStatus(selectedQa) === 'skipped' && (
                  <span className="text-sm text-slate-400 font-medium">Skipped</span>
                )}
              </div>
              <p className="text-white leading-relaxed">{selectedQa.question_text}</p>
              {selectedQa.selected_option != null && selectedQa.selected_option !== '' && (
                <p className="text-slate-400">
                  Your answer:{' '}
                  <span className={selectedQa.is_correct ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
                    {selectedQa.selected_option}
                  </span>
                </p>
              )}
              <p className="text-slate-300">
                Correct answer: <span className="text-pink-400 font-medium">{selectedQa.correct_option}</span>
              </p>
              {selectedQa.solution_text && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-sm font-medium text-slate-300 mb-2">Solution</p>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selectedQa.solution_text}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-8 text-center border border-dashed border-white/10">
              <p className="text-slate-500">Select a question to view its details, solution, and correct answer.</p>
            </div>
          )}
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
