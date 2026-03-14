'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  getUserAnalyticsSummary,
  getAttemptAnalytics,
  AttemptAnalytics,
  AggregateAnalytics,
  AnalyticsSummaryAttempt,
  CombinedSession,
} from '@/api/tests';

export function useAnalyticsData(examId?: number) {
  const [aggregate, setAggregate] = useState<AggregateAnalytics | null>(null);
  const [attempts, setAttempts] = useState<AnalyticsSummaryAttempt[]>([]);
  const [totalPapers, setTotalPapers] = useState<number>(1);
  const [sessions, setSessions] = useState<CombinedSession[]>([]);
  const [selectedAttemptId, setSelectedAttemptId] = useState<number | null>(null);
  const [attemptAnalytics, setAttemptAnalytics] = useState<AttemptAnalytics | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoadingSummary(true);
        setError(null);
        const res = await getUserAnalyticsSummary(examId);
        if (res.success && res.data) {
          setAggregate(res.data.aggregate);
          setAttempts(res.data.attempts);
          setTotalPapers(res.data.total_papers ?? 1);
          setSessions(res.data.sessions ?? []);
          if (res.data.attempts.length > 0) {
            setSelectedAttemptId(res.data.attempts[0].id);
          } else {
            setSelectedAttemptId(null);
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
  }, [examId]);

  const loadAttemptAnalytics = useCallback(async (id: number) => {
    try {
      setLoadingAttempt(true);
      setAttemptAnalytics(null);
      const res = await getAttemptAnalytics(id);
      if (res.success && res.data) {
        setAttemptAnalytics(res.data);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingAttempt(false);
    }
  }, []);

  useEffect(() => {
    if (selectedAttemptId !== null) {
      loadAttemptAnalytics(selectedAttemptId);
    }
  }, [selectedAttemptId, loadAttemptAnalytics]);

  return {
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
  };
}
