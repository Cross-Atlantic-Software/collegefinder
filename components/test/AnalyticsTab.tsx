'use client';
import { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/shared';
import { getTestResults } from '@/api/tests';
import { normalizeTestResults } from './utils';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import EmptyState from './analytics/EmptyState';
import TestResults from './interface/modals/TestResults';
import {
  AggregateKPISection,
  AttemptSelector,
  SelectedAttemptStats,
  MatrixSection,
  ChartsSection,
  ScoreTrendSection,
} from './analytics/sections';
import { attemptLabel, attemptTimestamp } from './analytics/utils';
import type { Dimension } from './analytics/utils';
import type { AnalyticsSummaryAttempt } from '@/api/tests';

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
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const {
    aggregate,
    attempts,
    selectedAttemptId,
    setSelectedAttemptId,
    attemptAnalytics,
    loadingSummary,
    loadingAttempt,
    error,
  } = useAnalyticsData(examId);

  const selectedAttempt = attempts.find((a) => a.id === selectedAttemptId) ?? null;
  const overallData = attemptAnalytics?.overall ?? null;

  const handleViewReviewForAttempt = useCallback(async (attempt: AnalyticsSummaryAttempt) => {
    setReviewLoading(true);
    setReviewError(null);
    try {
      const res = await getTestResults(attempt.id);
      if (res.success && res.data) {
        const normalized = normalizeTestResults({}, res);
        setReviewData(normalized);
        setReviewAttempt(attempt);
      } else {
        setReviewError(res.message || 'Failed to load review');
      }
    } catch {
      setReviewError('Failed to load review');
    } finally {
      setReviewLoading(false);
    }
  }, []);

  const handleCloseReview = useCallback(() => {
    setReviewData(null);
    setReviewAttempt(null);
    setReviewError(null);
  }, []);

  const reviewOverlay =
    reviewData && reviewAttempt && typeof document !== 'undefined'
      ? createPortal(
          <TestResults
            examName={attemptLabel(reviewAttempt)}
            summary={reviewData.summary}
            questionAttempts={reviewData.question_attempts}
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

  return (
    <div className="space-y-6">
      {reviewOverlay}
      <AggregateKPISection aggregate={aggregate} />
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
      {reviewError && (
        <div className="rounded-md bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {reviewError}
        </div>
      )}

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
    </div>
  );
}
