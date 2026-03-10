import { formatTimeSpent } from '@/api/tests';
import type { AnalyticsSummaryAttempt } from '@/api/tests';

export type Dimension = 'total' | 'subject' | 'topic' | 'sub_topic';

export const DIMENSION_OPTIONS: { id: Dimension; label: string }[] = [
  { id: 'total', label: 'Total' },
  { id: 'subject', label: 'Subject' },
  { id: 'topic', label: 'Topic' },
  { id: 'sub_topic', label: 'Sub-Topic' },
];

export function accuracyColor(acc: number): string {
  if (acc >= 75) return 'text-emerald-400';
  if (acc >= 50) return 'text-yellow-400';
  if (acc >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export function accuracyBg(acc: number): string {
  if (acc >= 75) return 'bg-emerald-500';
  if (acc >= 50) return 'bg-yellow-500';
  if (acc >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

export function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

export function fmtTime(secs: number): string {
  return formatTimeSpent(Math.round(secs));
}

export function attemptLabel(a: AnalyticsSummaryAttempt): string {
  const date = new Date(a.completed_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
  return `${a.exam_name} — ${date}`;
}
