'use client';
import type { AnalyticsSummaryAttempt } from '@/api/tests';
import { attemptLabel } from '../utils';

interface AttemptSelectorProps {
  attempts: AnalyticsSummaryAttempt[];
  selectedAttemptId: number | null;
  onSelect: (id: number) => void;
}

export default function AttemptSelector({
  attempts,
  selectedAttemptId,
  onSelect,
}: AttemptSelectorProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <label className="text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">
        Viewing Attempt
      </label>
      <select
        className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
        value={selectedAttemptId ?? ''}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {attempts.map((a) => (
          <option key={a.id} value={a.id} className="bg-[#1a1a2e]">
            {attemptLabel(a)}
          </option>
        ))}
      </select>
    </div>
  );
}
