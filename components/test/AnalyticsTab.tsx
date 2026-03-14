'use client';
import { useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/shared';
import { getTestResults, getExamFormats } from '@/api/tests';
import { normalizeTestResults } from './utils';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import EmptyState from './analytics/EmptyState';
import MockReviewScreen from './interface/MockReviewScreen';
import {
  AggregateKPISection,
  AttemptSelector,
  SelectedAttemptStats,
  MatrixSection,
  ChartsSection,
  ScoreTrendSection,
} from './analytics/sections';
import { attemptLabel, attemptTimestamp, fmt } from './analytics/utils';
import type { Dimension } from './analytics/utils';
import type { AnalyticsSummaryAttempt, ExamFormat, CombinedSession } from '@/api/tests';

interface AnalyticsTabProps {
  examId?: number;
}

type ReviewData = {
  summary: { total_score: number; total_questions: number; attempted: number; correct: number; incorrect: number; skipped: number; accuracy: number; time_taken: number };
  question_attempts: Array<{ question_text: string; correct_option: string; solution_text?: string; options?: Array<{ key: string; text: string }>; marks: number; subject: string; selected_option?: string; is_correct: boolean }>;
};

export default function AnalyticsTab({ examId }: AnalyticsTabProps) {
  const [dimension, setDimension] = useState<Dimension>('total');
  const [showHistoryList, setShowHistoryList] = useState(false);
  const [reviewData, setReviewData] = useState<ReviewData | null>(null);
  const [reviewAttempt, setReviewAttempt] = useState<AnalyticsSummaryAttempt | null>(null);
  const [reviewFormat, setReviewFormat] = useState<ExamFormat | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const {
    aggregate,
    attempts,
    totalPapers,
    sessions,
    selectedAttemptId,
    setSelectedAttemptId,
    attemptAnalytics,
    loadingSummary,
    loadingAttempt,
    error,
  } = useAnalyticsData(examId);

  const [viewMode, setViewMode] = useState<'by_attempt' | 'full_exam'>('by_attempt');
  const [selectedSessionIndex, setSelectedSessionIndex] = useState(0);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) ?? null;
  const overallData = attemptAnalytics?.overall ?? null;
  const selectedSession: CombinedSession | null = sessions.length > 0 ? sessions[selectedSessionIndex] ?? sessions[0] : null;

  const combinedOverallForStats = useMemo(() => {
    if (!selectedSession) return null;
    const attempted = selectedSession.combined_attempted;
    const totalTimeSecs = selectedSession.combined_time_minutes * 60;
    return {
      total_questions: attempted,
      attempted: selectedSession.combined_attempted,
      correct: selectedSession.combined_correct,
      incorrect: selectedSession.combined_incorrect,
      skipped: selectedSession.combined_skipped,
      attempt_rate: attempted > 0 ? 100 : 0,
      accuracy_percentage: selectedSession.combined_accuracy,
      total_score: selectedSession.combined_total_score,
      total_marks: undefined,
      percentile: null as number | null,
      rank_position: null as number | null,
      total_time_seconds: totalTimeSecs,
      avg_time_per_question: attempted > 0 ? totalTimeSecs / attempted : 0,
      negative_marks_lost: 0,
    };
  }, [selectedSession]);

  const handleViewReviewForAttempt = useCallback(async (attempt: AnalyticsSummaryAttempt) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const [resultsRes, formatsRes] = await Promise.all([
        getTestResults(attempt.id),
        examId != null ? getExamFormats(examId) : Promise.resolve({ success: false, data: null }),
      ]);
      if (resultsRes.success && resultsRes.data) {
        const normalized = normalizeTestResults({}, resultsRes);
        setReviewData(normalized);
        setReviewAttempt(attempt);
        let format: ExamFormat | null = null;
        if (formatsRes.success && formatsRes.data?.formats && Object.keys(formatsRes.data.formats).length > 0) {
          const formats = formatsRes.data.formats;
          const totalQuestions = normalized.question_attempts?.length ?? 0;
          const matching = Object.values(formats).find(
            (f) => totalQuestions === Object.values(f.sections || {}).reduce((s, sec) => s + Object.values(sec.subsections || {}).reduce((a, sub) => a + (sub?.questions ?? 0), 0), 0)
          );
          format = matching ?? Object.values(formats)[0] ?? null;
        }
        setReviewFormat(format);
      } else {
        setReviewError(resultsRes.message || 'Failed to load review');
      }
    } catch {
      setReviewError('Failed to load review');
    } finally {
      setReviewLoading(false);
    }
  }, [examId]);

  const handleCloseReview = useCallback(() => {
    setReviewData(null);
    setReviewAttempt(null);
    setReviewFormat(null);
    setReviewError(null);
  }, []);

  const reviewOverlay =
    reviewData && reviewAttempt && typeof document !== 'undefined'
      ? createPortal(
          <MockReviewScreen
            examName={attemptLabel(reviewAttempt)}
            questionAttempts={reviewData.question_attempts}
            format={reviewFormat}
            onExit={handleCloseReview}
            exitLabel="Back"
          />,
          document.body
        )
      : null;

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
    return <EmptyState examId={examId} />;
  }

  if (showHistoryList) {
    return (
      <div className="space-y-6">
        {reviewOverlay}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Test History</h2>
          <Button
            onClick={() => setShowHistoryList(false)}
            variant="themeButtonOutline"
            size="sm"
          >
            Back to Analytics
          </Button>
        </div>
        <p className="text-slate-400 text-sm">Click any test to view full review with solutions.</p>
        {reviewError && (
          <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {reviewError}
          </div>
        )}
        <div className="space-y-2">
          {attempts.map((a) => (
            <button
              key={a.id}
              onClick={() => handleViewReviewForAttempt(a)}
              disabled={reviewLoading}
              className="w-full flex items-center justify-between gap-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-3 text-left transition disabled:opacity-50"
            >
              <span className="font-medium text-white">{attemptLabel(a)}</span>
              <span className="text-sm text-slate-400 flex-shrink-0">{attemptTimestamp(a)}</span>
              <span className="text-sm text-pink-400">{a.total_score} pts</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const showFullExamMode = totalPapers > 1 && sessions.length > 0;

  return (
    <div className="space-y-6">
      {reviewOverlay}
      <AggregateKPISection aggregate={aggregate} />
      {reviewError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {reviewError}
        </div>
      )}
      {showFullExamMode && (
        <div className="flex gap-2 p-1 rounded-lg bg-white/5 border border-white/10 w-fit">
          <button
            type="button"
            onClick={() => setViewMode('by_attempt')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'by_attempt' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            By attempt
          </button>
          <button
            type="button"
            onClick={() => setViewMode('full_exam')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition ${
              viewMode === 'full_exam' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Full exam (combined)
          </button>
        </div>
      )}
      {viewMode === 'full_exam' && selectedSession && combinedOverallForStats ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <label className="text-sm text-slate-400">Session</label>
            <select
              value={selectedSessionIndex}
              onChange={(e) => setSelectedSessionIndex(Number(e.target.value))}
              className="bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {sessions.map((s, i) => (
                <option key={s.completed_at + i} value={i}>
                  {new Date(s.completed_at).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  – Paper 1 + Paper 2
                </option>
              ))}
            </select>
            <Button
              onClick={() => setShowHistoryList(true)}
              variant="themeButtonOutline"
              size="sm"
            >
              View History
            </Button>
          </div>
          <SelectedAttemptStats overallData={combinedOverallForStats} />
          <div className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Per paper</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-white/10">
                    <th className="pb-2 pr-4">Paper</th>
                    <th className="pb-2 pr-4">Score</th>
                    <th className="pb-2 pr-4">Accuracy</th>
                    <th className="pb-2 pr-4">Attempted</th>
                    <th className="pb-2">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSession.papers
                    .sort((a, b) => a.mock_order_index - b.mock_order_index)
                    .map((p) => (
                      <tr key={p.attempt_id} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-white font-medium">Paper {p.mock_order_index}</td>
                        <td className="py-2 pr-4 text-pink-400">{fmt(p.total_score)}</td>
                        <td className="py-2 pr-4 text-slate-300">{fmt(p.accuracy_percentage, 1)}%</td>
                        <td className="py-2 pr-4 text-slate-300">{p.attempted_count}</td>
                        <td className="py-2 text-slate-300">{p.time_spent_minutes}m</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
          <ScoreTrendSection
            attempts={attempts}
            aggregate={aggregate}
            selectedAttemptId={selectedAttemptId}
            onSelectAttempt={setSelectedAttemptId}
          />
        </>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
            <AttemptSelector
              attempts={attempts}
              selectedAttemptId={selectedAttemptId}
              onSelect={setSelectedAttemptId}
            />
            <Button
              onClick={() => setShowHistoryList(true)}
              variant="themeButtonOutline"
              size="sm"
            >
              View History
            </Button>
          </div>
          {loadingAttempt && (
            <div className="space-y-4 animate-pulse">
              <div className="bg-white/10 rounded-xl h-24" />
              <div className="bg-white/10 rounded-xl h-72" />
            </div>
          )}

          {!loadingAttempt && overallData && selectedAttempt && attemptAnalytics && (
            <>
              <SelectedAttemptStats overallData={overallData} />
              <MatrixSection
                dimension={dimension}
                setDimension={setDimension}
                attemptAnalytics={attemptAnalytics}
              />
              <ChartsSection bySubject={attemptAnalytics.by_subject} />
              <ScoreTrendSection
                attempts={attempts}
                aggregate={aggregate}
                selectedAttemptId={selectedAttemptId}
                onSelectAttempt={setSelectedAttemptId}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
