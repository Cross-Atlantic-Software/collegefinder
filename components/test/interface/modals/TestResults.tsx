'use client'
import { useState } from 'react';
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
  exitLabel?: string;
}

function getQuestionStatus(qa: QuestionAttempt): 'right' | 'wrong' | 'skipped' {
  const attempted = qa.selected_option != null && qa.selected_option !== '';
  if (!attempted) return 'skipped';
  return qa.is_correct ? 'right' : 'wrong';
}

export default function TestResults({ examName, summary, questionAttempts, onExit, exitLabel = 'Back to Exams' }: TestResultsProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedQa = selectedIndex != null ? questionAttempts[selectedIndex] : null;

  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen bg-slate-900 overflow-y-auto">
      <div className="min-h-screen w-full py-8 px-6 lg:px-12 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
        <h1 className="text-2xl font-bold text-white mb-6">Test Results - {examName}</h1>

        {/* Summary cards: Total Score, Correct, Wrong, Accuracy, Time Taken */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-pink-400">{summary.total_score}</div>
            <div className="text-sm text-slate-400">Total Score</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-green-400">{summary.correct}</div>
            <div className="text-sm text-slate-400">Correct</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-red-400">{summary.incorrect}</div>
            <div className="text-sm text-slate-400">Wrong</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700">
            <div className="text-2xl font-bold text-pink-400">{summary.accuracy}%</div>
            <div className="text-sm text-slate-400">Accuracy</div>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 text-center border border-slate-700 col-span-2 sm:col-span-1">
            <div className="text-2xl font-bold text-pink-400">{summary.time_taken}m</div>
            <div className="text-sm text-slate-400">Time Taken</div>
          </div>
        </div>

        {/* Single grid of all question numbers: green=correct, red=wrong, grey=skipped */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Questions</h2>
          <p className="text-slate-400 text-sm mb-4">Click any question to view explanation.</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {questionAttempts.map((qa, idx) => {
              const num = idx + 1;
              const status = getQuestionStatus(qa);
              const isSelected = selectedIndex === idx;
              const baseStyle = 'min-w-[2.5rem] h-9 px-2 rounded-lg text-sm font-medium border transition hover:opacity-90';
              const statusStyle =
                status === 'right'
                  ? 'bg-green-900 text-green-200 border-green-600 hover:bg-green-800'
                  : status === 'wrong'
                    ? 'bg-red-900 text-red-200 border-red-600 hover:bg-red-800'
                    : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600';
              const selectedStyle = isSelected ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-slate-900' : '';
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`${baseStyle} ${statusStyle} ${selectedStyle}`}
                >
                  Q{num}
                </button>
              );
            })}
          </div>

          {/* Detail panel for selected question - explanation */}
          {selectedQa ? (
            <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 space-y-4">
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
            <div className="bg-slate-800/80 rounded-xl p-8 text-center border border-dashed border-slate-600">
              <p className="text-slate-500">Select a question to view its details, solution, and correct answer.</p>
            </div>
          )}
        </div>

        <div className="mt-8">
          <Button onClick={onExit} variant="themeButton" size="lg">
            {exitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
