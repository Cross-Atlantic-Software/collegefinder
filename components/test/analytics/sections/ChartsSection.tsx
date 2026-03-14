'use client';
import type { AttemptAnalytics } from '@/api/tests';
import { BarRow } from '../charts';
import { accuracyBg } from '../utils';

interface ChartsSectionProps {
  bySubject: AttemptAnalytics['by_subject'];
}

export default function ChartsSection({ bySubject }: ChartsSectionProps) {
  if (bySubject.length === 0) return null;

  const maxAccuracy = 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Accuracy by Subject</p>
        <div className="space-y-3">
          {bySubject.map((s) => (
            <BarRow
              key={s.label}
              label={s.label}
              value={s.accuracy_percentage}
              maxValue={maxAccuracy}
              color={accuracyBg(s.accuracy_percentage)}
            />
          ))}
        </div>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
          Avg Time / Question by Subject
        </p>
        <div className="space-y-3">
          {bySubject.map((s) => {
            const maxT = Math.max(...bySubject.map((x) => x.avg_time_per_question), 1);
            return (
              <BarRow
                key={s.label}
                label={s.label}
                value={s.avg_time_per_question}
                maxValue={maxT}
                color="bg-blue-500"
                suffix="s"
              />
            );
          })}
        </div>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
          Attempt Rate by Subject
        </p>
        <div className="space-y-3">
          {bySubject.map((s) => (
            <BarRow
              key={s.label}
              label={s.label}
              value={s.attempt_rate}
              maxValue={100}
              color="bg-purple-500"
            />
          ))}
        </div>
      </div>
      <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
          Negative Marks Lost by Subject
        </p>
        <div className="space-y-3">
          {bySubject.map((s) => {
            const maxN = Math.max(...bySubject.map((x) => x.negative_marks_lost), 1);
            return (
              <BarRow
                key={s.label}
                label={s.label}
                value={s.negative_marks_lost}
                maxValue={maxN}
                color="bg-red-500"
                suffix=""
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
