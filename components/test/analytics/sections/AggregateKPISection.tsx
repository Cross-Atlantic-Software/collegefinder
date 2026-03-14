'use client';
import { formatTimeSpent } from '@/api/tests';
import type { AggregateAnalytics } from '@/api/tests';
import { KPICard } from '../cards';
import { fmt } from '../utils';

interface AggregateKPISectionProps {
  aggregate: AggregateAnalytics;
}

export default function AggregateKPISection({ aggregate }: AggregateKPISectionProps) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Overall Performance</p>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Tests Taken" value={String(aggregate.completed_attempts)} />
        <KPICard label="Best Score" value={fmt(aggregate.best_score)} accent />
        <KPICard label="Avg Score" value={fmt(aggregate.avg_score, 1)} />
        <KPICard
          label="Avg Accuracy"
          value={`${fmt(aggregate.avg_accuracy, 1)}%`}
          sub={
            aggregate.avg_accuracy === 0
              ? undefined
              : aggregate.avg_accuracy >= 75
                ? 'Excellent'
                : aggregate.avg_accuracy >= 50
                  ? 'Good'
                  : 'Needs Work'
          }
        />
        <KPICard
          label="Avg Time"
          value={formatTimeSpent(Math.round(aggregate.avg_time_minutes * 60))}
        />
        <KPICard label="Total Attempts" value={String(aggregate.total_attempts)} />
      </div>
    </div>
  );
}
