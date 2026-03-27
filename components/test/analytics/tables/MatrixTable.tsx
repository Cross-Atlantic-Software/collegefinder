'use client'
import { AttemptAnalytics, AnalyticsDimensionRow } from '@/api/tests';

type Dimension = 'total' | 'subject' | 'topic' | 'sub_topic';

interface MatrixTableProps {
  dimension: Dimension;
  analytics: AttemptAnalytics;
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

function fmtTime(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = Math.floor(secs % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function accuracyColor(acc: number): string {
  if (acc >= 75) return 'text-emerald-400';
  if (acc >= 50) return 'text-yellow-400';
  if (acc >= 25) return 'text-orange-400';
  return 'text-red-400';
}

export default function MatrixTable({ dimension, analytics }: MatrixTableProps) {
  const rows: AnalyticsDimensionRow[] =
    dimension === 'subject'
      ? analytics.by_subject
      : dimension === 'topic'
      ? analytics.by_topic
      : dimension === 'sub_topic'
      ? analytics.by_sub_topic
      : [];

  const overall = analytics.overall;

  const metrics = [
    { key: 'total_score', label: 'Total Score' },
    { key: 'attempt_rate', label: 'Attempt Rate %' },
    { key: 'accuracy_percentage', label: 'Accuracy %' },
    { key: 'correct', label: 'Correct' },
    { key: 'incorrect', label: 'Incorrect' },
    { key: 'skipped', label: 'Skipped' },
    { key: 'avg_time_per_question', label: 'Avg Time/Q' },
    { key: 'negative_marks_lost', label: 'Neg. Marks Lost' },
  ] as const;

  const getOverallValue = (key: string): string => {
    switch (key) {
      case 'total_score':
        return overall.total_marks != null && overall.total_marks > 0
          ? `${overall.total_score} / ${overall.total_marks}`
          : fmt(overall.total_score);
      case 'attempt_rate': return `${fmt(overall.attempt_rate, 1)}%`;
      case 'accuracy_percentage': return `${fmt(overall.accuracy_percentage, 1)}%`;
      case 'correct': return fmt(overall.correct);
      case 'incorrect': return fmt(overall.incorrect);
      case 'skipped': return fmt(overall.skipped);
      case 'avg_time_per_question': return fmtTime(overall.avg_time_per_question);
      case 'negative_marks_lost': return fmt(overall.negative_marks_lost, 2);
      default: return '—';
    }
  };

  const getRowValue = (row: AnalyticsDimensionRow, key: string): string => {
    switch (key) {
      case 'total_score': return '—';
      case 'attempt_rate': return `${fmt(row.attempt_rate, 1)}%`;
      case 'accuracy_percentage': return `${fmt(row.accuracy_percentage, 1)}%`;
      case 'correct': return fmt(row.correct);
      case 'incorrect': return fmt(row.incorrect);
      case 'skipped': return fmt(row.skipped);
      case 'avg_time_per_question': return fmtTime(row.avg_time_per_question);
      case 'negative_marks_lost': return fmt(row.negative_marks_lost, 2);
      default: return '—';
    }
  };

  const getCellClass = (key: string, value: string): string => {
    if (key === 'accuracy_percentage' || key === 'attempt_rate') {
      const num = parseFloat(value);
      if (!isNaN(num)) return accuracyColor(num);
    }
    if (key === 'negative_marks_lost') {
      const num = parseFloat(value);
      if (!isNaN(num) && num > 0) return 'text-red-400';
    }
    if (key === 'correct') return 'text-emerald-400';
    if (key === 'incorrect') return 'text-red-400';
    if (key === 'skipped') return 'text-slate-400';
    return 'text-white';
  };

  const dimColumns = dimension === 'total' ? [] : rows;

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="bg-white/10 text-slate-400 text-xs uppercase tracking-wider">
            <th className="sticky left-0 bg-[#1a1a35] px-4 py-3 text-left font-medium border-r border-white/10 min-w-[150px]">
              Metric
            </th>
            <th className="px-4 py-3 text-center font-medium border-r border-white/10 whitespace-nowrap">
              Total
            </th>
            {dimColumns.map((row, i) => (
              <th
                key={i}
                className="px-4 py-3 text-center font-medium border-r border-white/10 whitespace-nowrap max-w-[140px]"
                title={row.label}
              >
                <span className="block truncate max-w-[130px]">{row.label}</span>
                {row.subject && dimension !== 'subject' && (
                  <span className="block text-[10px] text-slate-500 font-normal truncate max-w-[130px]">
                    {row.subject}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((metric, mi) => (
            <tr
              key={metric.key}
              className={`border-t border-white/5 ${mi % 2 === 0 ? 'bg-white/[0.02]' : ''}`}
            >
              <td className="sticky left-0 bg-[#1a1a35] px-4 py-3 text-slate-300 font-medium border-r border-white/10 whitespace-nowrap">
                {metric.label}
              </td>
              <td
                className={`px-4 py-3 text-center border-r border-white/10 font-semibold ${getCellClass(
                  metric.key,
                  getOverallValue(metric.key)
                )}`}
              >
                {getOverallValue(metric.key)}
              </td>
              {dimColumns.map((row, ri) => {
                const val = getRowValue(row, metric.key);
                return (
                  <td
                    key={ri}
                    className={`px-4 py-3 text-center border-r border-white/10 ${getCellClass(
                      metric.key,
                      val
                    )}`}
                  >
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
