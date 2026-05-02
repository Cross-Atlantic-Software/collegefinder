'use client';
import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { getMockPaperStatus, type ExamFormat, type PaperStatusItem } from '@/api/tests';
import { getUserAnalyticsSummary } from '@/api/tests';
import FullscreenTestInterface from './FullscreenTestInterface';

interface MultiPaperTestInterfaceProps {
  exam: { id: number; name: string; code: string };
  numberOfPapers: number;
  formats: Record<string, ExamFormat>;
  onExit: () => void;
}

function fullscreenOverlay(content: ReactNode): ReactNode {
  if (typeof document === 'undefined') return content;
  return createPortal(content, document.body);
}

type ViewState = 'paper-selection' | 'paper-active';

export default function MultiPaperTestInterface({
  exam,
  numberOfPapers,
  formats,
  onExit,
}: MultiPaperTestInterfaceProps) {
  const [viewState, setViewState] = useState<ViewState>('paper-selection');
  const [activePaper, setActivePaper] = useState<number | null>(null);
  const [papers, setPapers] = useState<PaperStatusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mockNumber, setMockNumber] = useState(1);

  const fetchPaperStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // First determine the current mock number from analytics
      const analyticsRes = await getUserAnalyticsSummary(exam.id);
      let completedMocks = 0;
      if (analyticsRes.success && analyticsRes.data?.attempts) {
        const attempts = analyticsRes.data.attempts;
        // Count completed mock sessions (all papers done)
        const byOrder: Record<number, Set<number>> = {};
        for (const a of attempts) {
          if (a.exam_mock_id && a.mock_order_index != null) {
            const order = a.mock_order_index;
            if (!byOrder[order]) byOrder[order] = new Set();
            byOrder[order].add(1); // legacy: assume paper 1 for old attempts
          }
        }
        // Count orders where all papers are completed
        for (const paperSet of Object.values(byOrder)) {
          if (paperSet.size >= numberOfPapers) completedMocks++;
        }
      }
      const nextMock = completedMocks + 1;
      setMockNumber(nextMock);

      const statusRes = await getMockPaperStatus(exam.id, nextMock);
      if (statusRes.success && statusRes.data) {
        setPapers(statusRes.data.papers);
      } else {
        setError(statusRes.message || 'Failed to load paper status');
      }
    } catch {
      setError('Failed to load paper status');
    } finally {
      setLoading(false);
    }
  }, [exam.id, numberOfPapers]);

  useEffect(() => {
    fetchPaperStatus();
  }, [fetchPaperStatus]);

  const getFormatForPaper = (paperNumber: number): ExamFormat | null => {
    const keys = Object.keys(formats);
    // Try paper1/paper2 naming
    const paperKey = `paper${paperNumber}`;
    if (formats[paperKey]) return { ...formats[paperKey], format_id: paperKey };
    // Fallback: by index
    if (keys[paperNumber - 1]) {
      const key = keys[paperNumber - 1];
      return { ...formats[key], format_id: key };
    }
    return null;
  };

  const handleSelectPaper = (paperNumber: number) => {
    setActivePaper(paperNumber);
    setViewState('paper-active');
  };

  const handlePaperComplete = () => {
    setViewState('paper-selection');
    setActivePaper(null);
    fetchPaperStatus();
  };

  const handleAttemptLater = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {});
    }
    onExit();
  };

  // Render the active paper's test interface
  if (viewState === 'paper-active' && activePaper != null) {
    const paperFormat = getFormatForPaper(activePaper);
    if (!paperFormat) {
      return fullscreenOverlay(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
          <div className="text-center">
            <p className="mb-4 text-red-600 dark:text-red-400">Format not found for Paper {activePaper}</p>
            <button
              onClick={() => { setViewState('paper-selection'); setActivePaper(null); }}
              className="rounded-full border border-black bg-black px-6 py-2 text-[#FAD53C] transition hover:bg-black/90"
            >
              Back to Papers
            </button>
          </div>
        </div>
      );
    }

    return (
      <FullscreenTestInterface
        exam={exam}
        format={paperFormat}
        paperNumber={activePaper}
        onExit={handlePaperComplete}
      />
    );
  }

  // Paper Selection Screen
  const allCompleted = papers.length > 0 && papers.every(p => p.status === 'completed');

  return fullscreenOverlay(
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
              {exam.name} — Mock {mockNumber}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              This exam has {numberOfPapers} papers. Complete them in order.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center gap-6">
              {Array.from({ length: numberOfPapers }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-xs animate-pulse rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="mb-4 h-8 rounded bg-slate-200 dark:bg-slate-700" />
                  <div className="mb-2 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="mb-6 h-4 rounded bg-slate-100 dark:bg-slate-800" />
                  <div className="h-12 rounded-lg bg-slate-200 dark:bg-slate-700" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Paper Cards */}
              <div className="flex justify-center gap-6 flex-wrap">
                {papers.map((paper) => (
                  <PaperCard
                    key={paper.paper_number}
                    paper={paper}
                    examName={exam.name}
                    onSelect={() => handleSelectPaper(paper.paper_number)}
                  />
                ))}
              </div>

              {/* All completed message */}
              {allCompleted && (
                <div className="mt-8 text-center">
                  <div className="inline-flex items-center gap-2 bg-green-500/15 border border-green-500/30 rounded-lg px-6 py-3 text-green-300">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">
                      All papers completed for Mock {mockNumber}!
                    </span>
                  </div>
                </div>
              )}

              {/* Attempt Later / Exit button */}
              <div className="mt-10 flex justify-center">
                <button
                  onClick={handleAttemptLater}
                  className="rounded-full border border-slate-200 bg-white px-8 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  {allCompleted ? 'Back to Exams' : 'Attempt Later'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Paper Card Component ----------

function PaperCard({
  paper,
  examName,
  onSelect,
}: {
  paper: PaperStatusItem;
  examName: string;
  onSelect: () => void;
}) {
  const isLocked = paper.status === 'locked';
  const isCompleted = paper.status === 'completed';
  const isGenerating = paper.status === 'generating' || paper.status === 'not_generated';
  const isUnlocked = paper.status === 'unlocked' || paper.status === 'in_progress';

  return (
    <div
      className={`
        flex-1 max-w-xs rounded-2xl p-8 transition-all relative overflow-hidden
        ${isLocked
          ? 'border border-slate-200 bg-slate-100 opacity-70 dark:border-slate-700 dark:bg-slate-800/70'
          : isCompleted
            ? 'border border-green-300 bg-green-50 dark:border-green-700/40 dark:bg-green-950/20'
            : isGenerating
              ? 'border border-[#FAD53C]/50 bg-[#FAD53C]/15 dark:border-[#FAD53C]/30 dark:bg-[#FAD53C]/10'
              : 'cursor-pointer border border-slate-200 bg-white hover:-translate-y-0.5 hover:border-black/20 hover:shadow-md dark:border-slate-700 dark:bg-slate-900'
        }
      `}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="rounded-full bg-white/90 p-4 shadow-sm dark:bg-slate-900/80">
            <svg className="h-8 w-8 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div className="absolute top-4 right-4">
          <div className="rounded-full bg-green-500 p-1.5">
            <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className={isLocked ? 'blur-[2px]' : ''}>
        <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-slate-100">
          Paper {paper.paper_number}
        </h2>
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          {examName} — Paper {paper.paper_number}
        </p>

        {paper.total_questions > 0 && (
          <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">
            {paper.total_questions} Questions
          </p>
        )}

        {/* Completed stats */}
        {isCompleted && paper.attempt_data && (
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-slate-200 bg-white p-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                <div className="text-green-400 font-semibold">{paper.attempt_data.total_score}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Score</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-2 text-center dark:border-slate-700 dark:bg-slate-800/80">
                <div className="text-green-400 font-semibold">
                  {Math.round(paper.attempt_data.accuracy_percentage)}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Accuracy</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 text-xs text-center">
              <div>
                <span className="text-green-400">{paper.attempt_data.correct_count}</span>
                <span className="text-slate-500"> correct</span>
              </div>
              <div>
                <span className="text-red-400">{paper.attempt_data.incorrect_count}</span>
                <span className="text-slate-500"> wrong</span>
              </div>
              <div>
                <span className="text-slate-400">{paper.attempt_data.skipped_count}</span>
                <span className="text-slate-500"> skip</span>
              </div>
            </div>
          </div>
        )}

        {/* Start button: always visible when paper is not locked and not completed */}
        {!isLocked && !isCompleted && (
          <>
            <button
              onClick={onSelect}
              className="w-full rounded-full border border-black bg-black py-3 text-sm font-medium text-[#FAD53C] transition hover:bg-black/90 cursor-pointer"
            >
              Start
            </button>
            {isGenerating && (
              <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#b88900] dark:text-[#FAD53C]">
                <div className="h-3 w-3 animate-spin rounded-full border-b-2 border-[#b88900] dark:border-[#FAD53C]" />
                Generating questions…
              </div>
            )}
          </>
        )}

        {isCompleted && (
          <div className="py-2 text-center text-sm font-medium text-green-600 dark:text-green-400">
            Completed
          </div>
        )}

        {isLocked && (
          <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
            Complete Paper {paper.paper_number - 1} first
          </p>
        )}
      </div>
    </div>
  );
}
