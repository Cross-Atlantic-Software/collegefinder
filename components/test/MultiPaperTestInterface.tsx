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
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">Format not found for Paper {activePaper}</p>
            <button
              onClick={() => { setViewState('paper-selection'); setActivePaper(null); }}
              className="px-6 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition"
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
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center py-8 px-4">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              {exam.name} — Mock {mockNumber}
            </h1>
            <p className="text-slate-300 text-lg">
              This exam has {numberOfPapers} papers. Complete them in order.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="flex justify-center gap-6">
              {Array.from({ length: numberOfPapers }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 max-w-xs bg-white/10 rounded-2xl p-8 animate-pulse"
                >
                  <div className="h-8 bg-white/20 rounded mb-4" />
                  <div className="h-4 bg-white/10 rounded mb-2" />
                  <div className="h-4 bg-white/10 rounded mb-6" />
                  <div className="h-12 bg-white/20 rounded-lg" />
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
                  className="px-8 py-3 border border-white/20 text-slate-300 rounded-lg hover:bg-white/10 hover:text-white transition text-sm font-medium"
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
          ? 'bg-white/5 border border-white/10 opacity-60'
          : isCompleted
            ? 'bg-green-500/10 border border-green-500/30'
            : isGenerating
              ? 'bg-yellow-500/10 border border-yellow-500/30'
              : 'bg-white/10 border border-pink-500/30 hover:bg-white/15 hover:border-pink-500/50 hover:scale-[1.02] cursor-pointer'
        }
      `}
    >
      {/* Lock overlay */}
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-slate-800/80 rounded-full p-4">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>
      )}

      {/* Completed checkmark */}
      {isCompleted && (
        <div className="absolute top-4 right-4">
          <div className="bg-green-500 rounded-full p-1.5">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      )}

      <div className={isLocked ? 'blur-[2px]' : ''}>
        <h2 className="text-xl font-bold text-white mb-1">
          Paper {paper.paper_number}
        </h2>
        <p className="text-slate-400 text-sm mb-4">
          {examName} — Paper {paper.paper_number}
        </p>

        {paper.total_questions > 0 && (
          <p className="text-slate-300 text-sm mb-4">
            {paper.total_questions} Questions
          </p>
        )}

        {/* Completed stats */}
        {isCompleted && paper.attempt_data && (
          <div className="space-y-2 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-green-400 font-semibold">{paper.attempt_data.total_score}</div>
                <div className="text-slate-400 text-xs">Score</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <div className="text-green-400 font-semibold">
                  {Math.round(paper.attempt_data.accuracy_percentage)}%
                </div>
                <div className="text-slate-400 text-xs">Accuracy</div>
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
              className="w-full py-3 rounded-lg font-medium transition text-sm bg-white text-purple-900 hover:bg-white/95 cursor-pointer"
            >
              Start
            </button>
            {isGenerating && (
              <div className="flex items-center justify-center gap-2 mt-2 text-yellow-400 text-xs">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-400" />
                Generating questions…
              </div>
            )}
          </>
        )}

        {isCompleted && (
          <div className="text-center text-green-400 text-sm font-medium py-2">
            Completed
          </div>
        )}

        {isLocked && (
          <p className="text-slate-500 text-xs text-center mt-2">
            Complete Paper {paper.paper_number - 1} first
          </p>
        )}
      </div>
    </div>
  );
}
