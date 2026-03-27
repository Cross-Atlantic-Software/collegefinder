'use client';

export type ReviewQuestionStatus = 'correct' | 'wrong' | 'skipped';

interface ReviewQuestionPaletteProps {
  totalQuestions: number;
  currentQuestionNumber: number;
  questionStatuses: Record<number, ReviewQuestionStatus>;
  onQuestionSelect: (questionNumber: number) => void;
}

export default function ReviewQuestionPalette({
  totalQuestions,
  currentQuestionNumber,
  questionStatuses,
  onQuestionSelect,
}: ReviewQuestionPaletteProps) {
  const correctCount = Object.values(questionStatuses).filter((s) => s === 'correct').length;
  const wrongCount = Object.values(questionStatuses).filter((s) => s === 'wrong').length;
  const skippedCount = Object.values(questionStatuses).filter((s) => s === 'skipped').length;

  return (
    <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question Palette</h3>
      </div>

      <div className="px-3 py-2.5 border-b border-slate-700 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-green-600 shrink-0" />
            Correct
          </div>
          <span className="text-green-400 font-medium tabular-nums">{correctCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-red-600 shrink-0" />
            Wrong
          </div>
          <span className="text-red-400 font-medium tabular-nums">{wrongCount}</span>
        </div>
        <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-slate-600 shrink-0" />
            Skipped
          </div>
          <span className="text-slate-300 font-medium tabular-nums">{skippedCount}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
            const status = questionStatuses[num] ?? 'skipped';
            const isCurrent = num === currentQuestionNumber;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onQuestionSelect(num)}
                title={`Question ${num}`}
                className={[
                  'w-full aspect-square rounded text-xs font-semibold transition',
                  isCurrent ? 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-800' : '',
                  status === 'correct' ? 'bg-green-600 hover:bg-green-500 text-white' : '',
                  status === 'wrong' ? 'bg-red-600 hover:bg-red-500 text-white' : '',
                  status === 'skipped' ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : '',
                ].join(' ')}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
