'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getUserAnalyticsSummary,
  getAttemptAnalytics,
  formatTimeSpent,
  AttemptAnalytics,
  AggregateAnalytics,
  AnalyticsSummaryAttempt,
  AnalyticsDimensionRow,
} from '@/api/tests';

// ─── Types ────────────────────────────────────────────────────────────────────

type Dimension = 'total' | 'subject' | 'topic' | 'sub_topic';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function accuracyColor(acc: number): string {
  if (acc >= 75) return 'text-emerald-400';
  if (acc >= 50) return 'text-yellow-400';
  if (acc >= 25) return 'text-orange-400';
  return 'text-red-400';
}

function accuracyBg(acc: number): string {
  if (acc >= 75) return 'bg-emerald-500';
  if (acc >= 50) return 'bg-yellow-500';
  if (acc >= 25) return 'bg-orange-500';
  return 'bg-red-500';
}

function fmt(n: number | null | undefined, decimals = 0): string {
  if (n === null || n === undefined) return '—';
  return n.toFixed(decimals);
}

function fmtTime(secs: number): string {
  return formatTimeSpent(Math.round(secs));
}

function attemptLabel(a: AnalyticsSummaryAttempt): string {
  const date = new Date(a.completed_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: '2-digit',
  });
  return `${a.exam_name} — ${date}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function KPICard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="bg-white/10 rounded-xl p-4 flex flex-col gap-1 border border-white/5">
      <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold ${accent ? 'text-pink-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

function QuickStatBadge({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2">
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
      <span className="text-xs text-slate-400">{label}</span>
      <span className="ml-auto text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

// Horizontal bar chart row
function BarRow({
  label,
  value,
  maxValue,
  color,
  suffix = '%',
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-28 truncate flex-shrink-0" title={label}>
        {label}
      </span>
      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-xs text-slate-300 w-12 text-right flex-shrink-0">
        {fmt(value, 1)}{suffix}
      </span>
    </div>
  );
}

// SVG donut chart (no library needed)
function DonutChart({
  correct,
  incorrect,
  skipped,
}: {
  correct: number;
  incorrect: number;
  skipped: number;
}) {
  const total = correct + incorrect + skipped || 1;
  const r = 36;
  const circumference = 2 * Math.PI * r;
  const correctPct = (correct / total) * circumference;
  const incorrectPct = (incorrect / total) * circumference;
  const skippedPct = (skipped / total) * circumference;

  // Offsets: start from top (rotate -90deg applied via transform)
  const correctOffset = 0;
  const incorrectOffset = -correctPct;
  const skippedOffset = -(correctPct + incorrectPct);

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="100" height="100" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
        {/* Correct – emerald */}
        {correct > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#34d399"
            strokeWidth="14"
            strokeDasharray={`${correctPct} ${circumference - correctPct}`}
            strokeDashoffset={circumference / 4}
            strokeLinecap="butt"
            transform="rotate(-90 50 50)"
          />
        )}
        {/* Incorrect – red */}
        {incorrect > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#f87171"
            strokeWidth="14"
            strokeDasharray={`${incorrectPct} ${circumference - incorrectPct}`}
            strokeDashoffset={circumference / 4 + correctOffset - incorrectOffset}
            transform="rotate(-90 50 50)"
            style={{ strokeDashoffset: `calc(${circumference / 4} + ${-(incorrectOffset)})` }}
          />
        )}
        {/* Skipped – slate */}
        {skipped > 0 && (
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke="#94a3b8"
            strokeWidth="14"
            strokeDasharray={`${skippedPct} ${circumference - skippedPct}`}
            style={{ strokeDashoffset: `calc(${circumference / 4} + ${correctPct + incorrectPct})` }}
            transform="rotate(-90 50 50)"
          />
        )}
        <text x="50" y="54" textAnchor="middle" className="fill-white" fontSize="13" fontWeight="bold">
          {total}
        </text>
      </svg>
      <div className="flex gap-4 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> {correct} Correct
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> {incorrect} Wrong
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" /> {skipped} Skipped
        </span>
      </div>
    </div>
  );
}

// ─── Matrix Table ─────────────────────────────────────────────────────────────

function MatrixTable({
  dimension,
  analytics,
}: {
  dimension: Dimension;
  analytics: AttemptAnalytics;
}) {
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

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
      </div>
      <p className="text-lg font-medium text-white">No analytics yet</p>
      <p className="text-sm text-center max-w-xs">
        Complete a practice test to see your detailed performance breakdown here.
      </p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsTab() {
  const [aggregate, setAggregate] = useState<AggregateAnalytics | null>(null);
  const [attempts, setAttempts] = useState<AnalyticsSummaryAttempt[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptAnalytics, setAttemptAnalytics] = useState<AttemptAnalytics | null>(null);
  const [dimension, setDimension] = useState<Dimension>('total');
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load aggregate summary on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSummary(true);
        const res = await getUserAnalyticsSummary();
        if (res.success && res.data) {
          setAggregate(res.data.aggregate);
          setAttempts(res.data.attempts);
          if (res.data.attempts.length > 0) {
            setSelectedAttemptId(res.data.attempts[0].id);
          }
        } else {
          setError(res.message || 'Failed to load analytics');
        }
      } catch {
        setError('Failed to load analytics');
      } finally {
        setLoadingSummary(false);
      }
    };
    load();
  }, []);

  // Load per-attempt analytics whenever selected attempt changes
  const loadAttemptAnalytics = useCallback(async (id: number) => {
    try {
      setLoadingAttempt(true);
      setAttemptAnalytics(null);
      const res = await getAttemptAnalytics(id);
      if (res.success && res.data) {
        setAttemptAnalytics(res.data);
      }
    } catch {
      // silently fail for per-attempt load; show empty state
    } finally {
      setLoadingAttempt(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAttemptId !== null) {
      loadAttemptAnalytics(selectedAttemptId);
    }
  }, [selectedAttemptId, loadAttemptAnalytics]);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loadingSummary) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/10 rounded-xl h-20" />
          ))}
        </div>
        <div className="bg-white/10 rounded-xl h-48" />
        <div className="bg-white/10 rounded-xl h-64" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
        {error}
      </div>
    );
  }

  if (!aggregate || attempts.length === 0) {
    return <EmptyState />;
  }

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) ?? null;
  const overallData = attemptAnalytics?.overall ?? null;

  // For charts, use selected attempt or first attempt data
  const chartSubjects = attemptAnalytics?.by_subject ?? [];
  const maxAccuracy = 100;

  return (
    <div className="space-y-6">
      {/* ── Section 1: Aggregate KPI Cards ───────────────────────────────── */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Overall Performance</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPICard label="Tests Taken" value={String(aggregate.completed_attempts)} />
          <KPICard
            label="Best Score"
            value={fmt(aggregate.best_score)}
            accent
          />
          <KPICard
            label="Avg Score"
            value={fmt(aggregate.avg_score, 1)}
          />
          <KPICard
            label="Avg Accuracy"
            value={`${fmt(aggregate.avg_accuracy, 1)}%`}
            sub={
              aggregate.avg_accuracy >= 75
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

      {/* ── Section 2: Attempt Selector ──────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-xs text-slate-400 uppercase tracking-wider whitespace-nowrap">
          Viewing Attempt
        </label>
        <select
          className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-500"
          value={selectedAttemptId ?? ''}
          onChange={(e) => setSelectedAttemptId(Number(e.target.value))}
        >
          {attempts.map((a) => (
            <option key={a.id} value={a.id} className="bg-[#1a1a2e]">
              {attemptLabel(a)}
            </option>
          ))}
        </select>
      </div>

      {loadingAttempt && (
        <div className="space-y-4 animate-pulse">
          <div className="bg-white/10 rounded-xl h-24" />
          <div className="bg-white/10 rounded-xl h-72" />
        </div>
      )}

      {!loadingAttempt && overallData && selectedAttempt && (
        <>
          {/* ── Section 3: Quick Stats for Selected Attempt ──────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: KPI highlights */}
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
                  sub={`${overallData.attempted} / ${overallData.total_questions} Qs`}
                />
              </div>
            </div>

            {/* Right: Quick stat badges + donut */}
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

          {/* ── Section 4: Matrix Table ───────────────────────────────────── */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <p className="text-sm font-semibold text-white">Performance Matrix</p>
              {/* Dimension Toggle */}
              <div className="flex rounded-lg bg-white/10 overflow-hidden text-xs font-medium">
                {(
                  [
                    { id: 'total', label: 'Total' },
                    { id: 'subject', label: 'Subject' },
                    { id: 'topic', label: 'Topic' },
                    { id: 'sub_topic', label: 'Sub-Topic' },
                  ] as { id: Dimension; label: string }[]
                ).map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDimension(d.id)}
                    className={`px-3 py-2 transition ${
                      dimension === d.id
                        ? 'bg-pink-600 text-white'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {(dimension !== 'total' && (
              dimension === 'subject' ? attemptAnalytics!.by_subject.length === 0 :
              dimension === 'topic' ? attemptAnalytics!.by_topic.length === 0 :
              attemptAnalytics!.by_sub_topic.length === 0
            )) ? (
              <div className="text-center py-8 text-slate-500 text-sm bg-white/[0.02] rounded-xl border border-white/10">
                No {dimension.replace('_', '-')} data available for this attempt.
              </div>
            ) : (
              <MatrixTable dimension={dimension} analytics={attemptAnalytics!} />
            )}
          </div>

          {/* ── Section 5: Charts ─────────────────────────────────────────── */}
          {chartSubjects.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Accuracy by Subject */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  Accuracy by Subject
                </p>
                <div className="space-y-3">
                  {chartSubjects.map((s) => (
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

              {/* Time per Subject */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  Avg Time / Question by Subject
                </p>
                <div className="space-y-3">
                  {chartSubjects.map((s) => {
                    const maxT = Math.max(...chartSubjects.map((x) => x.avg_time_per_question), 1);
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

              {/* Attempt Rate by Subject */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  Attempt Rate by Subject
                </p>
                <div className="space-y-3">
                  {chartSubjects.map((s) => (
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

              {/* Negative Marks by Subject */}
              <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">
                  Negative Marks Lost by Subject
                </p>
                <div className="space-y-3">
                  {chartSubjects.map((s) => {
                    const maxN = Math.max(...chartSubjects.map((x) => x.negative_marks_lost), 1);
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
          )}

          {/* ── Section 6: Score Trend (across all attempts) ─────────────── */}
          {attempts.length > 1 && (
            <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-4">Score Trend</p>
              <div className="space-y-2">
                {[...attempts].reverse().map((a) => {
                  const bestScore = aggregate.best_score || 1;
                  return (
                    <div
                      key={a.id}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition ${
                        a.id === selectedAttemptId
                          ? 'bg-pink-600/20 border border-pink-500/30'
                          : 'hover:bg-white/5'
                      }`}
                      onClick={() => setSelectedAttemptId(a.id)}
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
                        className={`text-xs w-10 text-right flex-shrink-0 ${accuracyColor(
                          a.accuracy_percentage
                        )}`}
                      >
                        {fmt(a.accuracy_percentage, 0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
