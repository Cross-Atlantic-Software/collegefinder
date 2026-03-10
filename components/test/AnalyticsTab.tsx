'use client';
import { useState } from 'react';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import EmptyState from './analytics/EmptyState';
import {
  AggregateKPISection,
  AttemptSelector,
  SelectedAttemptStats,
  MatrixSection,
  ChartsSection,
  ScoreTrendSection,
} from './analytics/sections';
import type { Dimension } from './analytics/utils';

export default function AnalyticsTab() {
  const [dimension, setDimension] = useState<Dimension>('total');
  const {
    aggregate,
    attempts,
    selectedAttemptId,
    setSelectedAttemptId,
    attemptAnalytics,
    loadingSummary,
    loadingAttempt,
    error,
  } = useAnalyticsData();

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

  return (
    <div className="space-y-6">
      <AggregateKPISection aggregate={aggregate} />
      <AttemptSelector
        attempts={attempts}
        selectedAttemptId={selectedAttemptId}
        onSelect={setSelectedAttemptId}
      />

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
