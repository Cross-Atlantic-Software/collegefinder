'use client';
import type { AttemptAnalytics } from '@/api/tests';
import { MatrixTable } from '../tables';
import { DIMENSION_OPTIONS, type Dimension } from '../utils';

interface MatrixSectionProps {
  dimension: Dimension;
  setDimension: (d: Dimension) => void;
  attemptAnalytics: AttemptAnalytics;
}

export default function MatrixSection({
  dimension,
  setDimension,
  attemptAnalytics,
}: MatrixSectionProps) {
  const hasNoData =
    dimension !== 'total' &&
    (dimension === 'subject'
      ? attemptAnalytics.by_subject.length === 0
      : dimension === 'topic'
        ? attemptAnalytics.by_topic.length === 0
        : attemptAnalytics.by_sub_topic.length === 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <p className="text-sm font-semibold text-white">Performance Matrix</p>
        <div className="flex rounded-lg bg-white/10 overflow-hidden text-xs font-medium">
          {DIMENSION_OPTIONS.map((d) => (
            <button
              key={d.id}
              onClick={() => setDimension(d.id)}
              className={`px-3 py-2 transition ${
                dimension === d.id ? 'bg-pink-600 text-white' : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>
      {hasNoData ? (
        <div className="text-center py-8 text-slate-500 text-sm bg-white/[0.02] rounded-xl border border-white/10">
          No {dimension.replace('_', '-')} data available for this attempt.
        </div>
      ) : (
        <MatrixTable dimension={dimension} analytics={attemptAnalytics} />
      )}
    </div>
  );
}
