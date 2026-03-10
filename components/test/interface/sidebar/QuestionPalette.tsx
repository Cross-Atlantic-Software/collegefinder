'use client'

type QuestionStatus = 'not_visited' | 'not_answered' | 'answered';

interface QuestionPaletteProps {
  totalQuestions: number;
  currentQuestionNumber: number;
  questionStatuses: Record<number, QuestionStatus>;
  loading: boolean;
  onQuestionSelect: (questionNumber: number) => void;
}

export default function QuestionPalette({
  totalQuestions,
  currentQuestionNumber,
  questionStatuses,
  loading,
  onQuestionSelect,
}: QuestionPaletteProps) {
  const answeredCount = Object.values(questionStatuses).filter(status => status === 'answered').length;
  const notAnsweredCount = Object.values(questionStatuses).filter(status => status === 'not_answered').length;
  const notVisitedCount = totalQuestions - Object.keys(questionStatuses).length;

  return (
    <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question Palette</h3>
      </div>

      {/* Legend with counts */}
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

      {/* Question number grid */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
            const status: QuestionStatus = questionStatuses[num] || 'not_visited';
            const isCurrent = num === currentQuestionNumber;
            return (
              <button
                key={num}
                onClick={() => onQuestionSelect(num)}
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
          <span className="text-green-400 font-semibold">{answeredCount}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Not Answered</span>
          <span className="text-red-400 font-semibold">{notAnsweredCount}</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Not Visited</span>
          <span className="text-slate-300 font-semibold">{notVisitedCount}</span>
        </div>
      </div>
    </div>
  );
}
