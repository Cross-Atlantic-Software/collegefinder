'use client';
import type { AggregateAnalytics, AnalyticsSummaryAttempt, CombinedSession } from '@/api/tests';
import { accuracyColor, fmt, attemptLabel } from '../utils';

interface ScoreTrendSectionProps {
  attempts: AnalyticsSummaryAttempt[];
  aggregate: AggregateAnalytics;
  selectedAttemptId: number | null;
  onSelectAttempt: (id: number) => void;
  sessions?: CombinedSession[];
  useSessionView?: boolean;
}

interface TrendEntry {
  key: string;
  label: string;
  score: number;
  accuracy: number;
  completed_at: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export default function ScoreTrendSection({
  attempts,
  aggregate,
  selectedAttemptId,
  onSelectAttempt,
  sessions,
  useSessionView,
}: ScoreTrendSectionProps) {
  let entries: TrendEntry[];

  if (useSessionView && sessions && sessions.length > 0) {
    const sessionEntries: TrendEntry[] = sessions.map((s) => ({
      key: s.attempt_ids.join('_'),
      label: `${s.exam_name} Mock ${s.mock_order_index}`,
      score: s.combined_total_score,
      accuracy: s.combined_accuracy,
      completed_at: s.completed_at,
      isSelected: s.attempt_ids.includes(selectedAttemptId ?? -1),
      onClick: () => onSelectAttempt(s.attempt_ids[0]),
    }));

    const singlePaperAttempts = attempts.filter(
      (a) => !sessions.some((s) => s.attempt_ids.includes(a.id))
    );

    const singleEntries: TrendEntry[] = singlePaperAttempts.map((a) => ({
      key: String(a.id),
      label: attemptLabel(a),
      score: a.total_score,
      accuracy: a.accuracy_percentage,
      completed_at: a.completed_at,
      isSelected: a.id === selectedAttemptId,
      onClick: () => onSelectAttempt(a.id),
    }));

    entries = [...sessionEntries, ...singleEntries].sort(
      (a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );
  } else {
    entries = attempts.map((a) => ({
      key: String(a.id),
      label: attemptLabel(a),
      score: a.total_score,
      accuracy: a.accuracy_percentage,
      completed_at: a.completed_at,
      isSelected: a.id === selectedAttemptId,
      onClick: () => onSelectAttempt(a.id),
    }));
    entries = [...entries].reverse();
  }

  if (entries.length <= 1) return null;

  const bestScore = Math.max(aggregate.best_score || 1, ...entries.map((e) => Math.abs(e.score)));

  return (
    <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Score Trend</p>
      <div className="space-y-2">
        {entries.map((e) => (
          <div
            key={e.key}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition ${
              e.isSelected
                ? 'bg-pink-600/20 border border-pink-500/30'
                : 'hover:bg-white/5'
            }`}
            onClick={e.onClick}
          >
            <span className="text-xs text-slate-400 w-32 truncate flex-shrink-0">
              {new Date(e.completed_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
              })}
              {' · '}
              {e.label}
            </span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-pink-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min((Math.abs(e.score) / bestScore) * 100, 100)}%` }}
              />
            </div>
            <span className="text-xs font-semibold text-pink-400 w-12 text-right flex-shrink-0">
              {e.score}
            </span>
            <span
              className={`text-xs w-10 text-right flex-shrink-0 ${accuracyColor(e.accuracy)}`}
            >
              {fmt(e.accuracy, 0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
