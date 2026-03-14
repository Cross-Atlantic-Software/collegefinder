'use client';
import type { AggregateAnalytics, AnalyticsSummaryAttempt } from '@/api/tests';
import { accuracyColor, fmt } from '../utils';

interface ScoreTrendSectionProps {
  attempts: AnalyticsSummaryAttempt[];
  aggregate: AggregateAnalytics;
  selectedAttemptId: number | null;
  onSelectAttempt: (id: number) => void;
}

export default function ScoreTrendSection({
  attempts,
  aggregate,
  selectedAttemptId,
  onSelectAttempt,
}: ScoreTrendSectionProps) {
  if (attempts.length <= 1) return null;

  const bestScore = aggregate.best_score || 1;

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Score Trend</p>
      <div className="space-y-2">
        {[...attempts].reverse().map((a) => (
          <div
            key={a.id}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition ${
              a.id === selectedAttemptId
                ? 'bg-pink-600/20 border border-pink-500/30'
                : 'hover:bg-white/5'
            }`}
            onClick={() => onSelectAttempt(a.id)}
          >
            <span className="text-xs text-slate-400 w-28 truncate flex-shrink-0">
              {new Date(a.completed_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
              {' · '}
              {a.exam_name}
            </span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((a.total_score / bestScore) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-pink-400 w-12 text-right flex-shrink-0">
              {a.total_score}
            </span>
            <span
              className={`text-xs w-10 text-right flex-shrink-0 ${accuracyColor(a.accuracy_percentage)}`}
            >
              {fmt(a.accuracy_percentage, 0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
