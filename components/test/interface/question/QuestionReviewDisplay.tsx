'use client';
import { Button } from '@/components/shared';

export interface QuestionAttemptForReview {
  question_text: string;
  correct_option: string;
  solution_text?: string;
  options?: Array<{ key: string; text: string }>;
  marks: number;
  subject: string;
  selected_option?: string;
  is_correct: boolean;
}

interface QuestionReviewDisplayProps {
  attempt: QuestionAttemptForReview;
  questionNumber: number;
  totalQuestions: number;
  onPrev: () => void;
  onNext: () => void;
}

function getStatus(attempt: QuestionAttemptForReview): 'correct' | 'wrong' | 'skipped' {
  const attempted = attempt.selected_option != null && attempt.selected_option !== '';
  if (!attempted) return 'skipped';
  return attempt.is_correct ? 'correct' : 'wrong';
}

export default function QuestionReviewDisplay({
  attempt,
  questionNumber,
  totalQuestions,
  onPrev,
  onNext,
}: QuestionReviewDisplayProps) {
  const status = getStatus(attempt);
  const options = attempt.options ?? [];
  const hasOptions = options.length > 0;

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Question meta */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs font-semibold bg-pink-600/20 text-pink-300 px-2.5 py-1 rounded-full">
            {attempt.subject}
          </span>
          <span className="text-xs text-slate-400">+{attempt.marks} marks</span>
          {status === 'correct' && (
            <span className="text-xs text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">✓ Correct</span>
          )}
          {status === 'wrong' && (
            <span className="text-xs text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">✗ Incorrect</span>
          )}
          {status === 'skipped' && (
            <span className="text-xs text-slate-400 bg-slate-500/20 px-2.5 py-1 rounded-full">Skipped</span>
          )}
        </div>

        {/* Question text */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <p className="text-white text-base leading-relaxed whitespace-pre-wrap">{attempt.question_text}</p>
        </div>

        {/* Options (read-only, with your answer + correct highlight) */}
        {hasOptions && (
          <div className="space-y-2.5">
            {options.map((option) => {
              const isUserAnswer = attempt.selected_option === option.key;
              const isCorrectOption = option.key === attempt.correct_option;
              const borderStyle =
                isCorrectOption
                  ? 'border-green-500 bg-green-900/30'
                  : isUserAnswer && !attempt.is_correct
                    ? 'border-red-500 bg-red-900/20'
                    : 'border-slate-700 bg-slate-800/60';
              return (
                <div
                  key={option.key}
                  className={`flex items-center gap-4 p-4 rounded-xl border-2 ${borderStyle}`}
                >
                  <div
                    className={`w-8 h-8 shrink-0 rounded-full border-2 flex items-center justify-center font-bold text-sm ${
                      isCorrectOption ? 'border-green-500 bg-green-500 text-white' : 'border-slate-500 text-slate-400'
                    }`}
                  >
                    {option.key}
                  </div>
                  <span className="text-white text-sm leading-relaxed flex-1">{option.text}</span>
                  {isUserAnswer && <span className="text-xs text-pink-300 font-medium">Your answer</span>}
                  {isCorrectOption && !isUserAnswer && <span className="text-xs text-green-400 font-medium">Correct</span>}
                  {isCorrectOption && isUserAnswer && <span className="text-xs text-green-400 font-medium">Correct ✓</span>}
                </div>
              );
            })}
          </div>
        )}

        {/* Numerical or no options: show user answer vs correct */}
        {!hasOptions && (
          <div className="space-y-2">
            {attempt.selected_option != null && attempt.selected_option !== '' && (
              <p className="text-slate-300 text-sm">
                Your answer: <span className={attempt.is_correct ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>{attempt.selected_option}</span>
              </p>
            )}
            <p className="text-slate-300 text-sm">
              Correct answer: <span className="text-green-400 font-medium">{attempt.correct_option}</span>
            </p>
          </div>
        )}

        {/* Solution */}
        {attempt.solution_text && (
          <div className="pt-4 border-t border-slate-700 space-y-2">
            <p className="text-sm font-semibold text-slate-300">Solution</p>
            <div className="bg-slate-800/80 rounded-xl p-5 border border-slate-700">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{attempt.solution_text}</p>
            </div>
          </div>
        )}

        {/* Navigation - same as test screen */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
          <div className="flex gap-2">
            {questionNumber > 1 && (
              <Button onClick={onPrev} variant="themeButtonOutline" size="sm">
                ← Prev
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            {questionNumber < totalQuestions && (
              <Button onClick={onNext} variant="themeButton" size="sm">
                Next →
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
