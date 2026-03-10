'use client';
import type { AttemptAnalytics } from '@/api/tests';
import { KPICard, QuickStatBadge } from '../cards';
import { DonutChart } from '../charts';
import { fmt, fmtTime } from '../utils';

interface SelectedAttemptStatsProps {
  overallData: NonNullable<AttemptAnalytics['overall']>;
}

export default function SelectedAttemptStats({ overallData }: SelectedAttemptStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Selected Test</p>
        <div className="grid grid-cols-2 gap-3">
          <KPICard
            label="Score"
            value={
              overallData.total_marks != null && overallData.total_marks > 0
                ? `${overallData.total_score} / ${overallData.total_marks}`
                : fmt(overallData.total_score)
            }
            accent
          />
          <KPICard
            label="Percentile"
            value={overallData.percentile !== null ? `${fmt(overallData.percentile, 1)}%ile` : '—'}
            sub={overallData.rank_position ? `AIR #${overallData.rank_position}` : undefined}
          />
          <KPICard
            label="Accuracy"
            value={`${fmt(overallData.accuracy_percentage, 1)}%`}
          />
          <KPICard
            label="Attempt Rate"
            value={`${fmt(overallData.attempt_rate, 1)}%`}
            sub={
              overallData.total_questions > 0
                ? `${overallData.attempted} / ${overallData.total_questions} Qs`
                : `${overallData.attempted} Qs attempted`
            }
          />
        </div>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">Breakdown</p>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <DonutChart
            correct={overallData.correct}
            incorrect={overallData.incorrect}
            skipped={overallData.skipped}
          />
          <div className="flex-1 space-y-2 w-full">
            <QuickStatBadge
              label="Total Time"
              value={fmtTime(overallData.total_time_seconds)}
              color="bg-blue-400"
            />
            <QuickStatBadge
              label="Avg Time / Question"
              value={fmtTime(overallData.avg_time_per_question)}
              color="bg-purple-400"
            />
            <QuickStatBadge
              label="Negative Marks Lost"
              value={fmt(overallData.negative_marks_lost, 2)}
              color="bg-red-400"
            />
            {overallData.rank_position && (
              <QuickStatBadge
                label="AIR"
                value={`#${overallData.rank_position}`}
                color="bg-pink-400"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
