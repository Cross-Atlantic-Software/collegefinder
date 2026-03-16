'use client';
import type { ReactNode } from 'react';
import SectionNavigation from './SectionNavigation';

// ─── Status types ────────────────────────────────────────────────────────────

export type TestQuestionStatus = 'not_visited' | 'not_answered' | 'answered';
export type ReviewQuestionStatus = 'correct' | 'wrong' | 'skipped';

// ─── Palette config per mode ─────────────────────────────────────────────────

type StatusConfig = {
  label: string;
  bgClass: string;
  dotClass: string;
  textClass: string;
};

const TEST_CONFIG: Record<TestQuestionStatus, StatusConfig> = {
  not_visited:  { label: 'Not Visited',  bgClass: 'bg-slate-600 hover:bg-slate-500',  dotClass: 'bg-slate-600 border border-slate-500', textClass: 'text-slate-300' },
  not_answered: { label: 'Not Answered', bgClass: 'bg-red-600 hover:bg-red-500',      dotClass: 'bg-red-600',                           textClass: 'text-red-400'   },
  answered:     { label: 'Answered',     bgClass: 'bg-green-600 hover:bg-green-500',  dotClass: 'bg-green-600',                         textClass: 'text-green-400' },
};

const REVIEW_CONFIG: Record<ReviewQuestionStatus, StatusConfig> = {
  skipped: { label: 'Skipped', bgClass: 'bg-slate-600 hover:bg-slate-500', dotClass: 'bg-slate-600', textClass: 'text-slate-300'  },
  wrong:   { label: 'Wrong',   bgClass: 'bg-red-600 hover:bg-red-500',     dotClass: 'bg-red-600',   textClass: 'text-red-400'    },
  correct: { label: 'Correct', bgClass: 'bg-green-600 hover:bg-green-500', dotClass: 'bg-green-600', textClass: 'text-green-400'  },
};

function getDefaultStatus(mode: 'test' | 'review'): TestQuestionStatus | ReviewQuestionStatus {
  return mode === 'test' ? 'not_visited' : 'skipped';
}

// ─── Section nav prop types (mirror SectionNavigation) ───────────────────────

interface SectionDef {
  name: string;
  subsections: Record<string, { questions: number; type?: string }>;
}

type SectionNavProps = {
  sections: Record<string, SectionDef>;
  currentSection: string;
  sectionProgress: Record<string, { name: string; attempted: number; total: number }>;
  currentSubsection: string;
  onSectionChange: (sectionKey: string) => void;
  onSubsectionChange: (subsection: string) => void;
};

// ─── Discriminated union for mode ────────────────────────────────────────────

type TestSidebarsProps = SectionNavProps & {
  totalQuestionsInSection: number;
  currentQuestionNumberInSection: number;
  onQuestionSelect: (num: number) => void;
} & (
  | { mode: 'test';   questionStatuses: Record<number, TestQuestionStatus>;   loading: boolean }
  | { mode: 'review'; questionStatuses: Record<number, ReviewQuestionStatus>; loading?: false }
);

// ─── Internal unified palette ─────────────────────────────────────────────────

function UnifiedQuestionPalette({
  mode,
  totalQuestions,
  currentQuestionNumber,
  questionStatuses,
  loading = false,
  onQuestionSelect,
}: {
  mode: 'test' | 'review';
  totalQuestions: number;
  currentQuestionNumber: number;
  questionStatuses: Record<number, TestQuestionStatus | ReviewQuestionStatus>;
  loading?: boolean;
  onQuestionSelect: (num: number) => void;
}) {
  const config = mode === 'test' ? TEST_CONFIG : REVIEW_CONFIG;
  const defaultStatus = getDefaultStatus(mode);
  const keys = Object.keys(config) as (TestQuestionStatus | ReviewQuestionStatus)[];

  const counts = keys.reduce<Record<string, number>>((acc, k) => {
    acc[k] = Object.values(questionStatuses).filter((s) => s === k).length;
    return acc;
  }, {});

  if (mode === 'test') {
    const testConfig = config as Record<string, StatusConfig>;
    const notVisitedCount = totalQuestions - Object.keys(questionStatuses).length;
    return (
      <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
        <div className="p-3 border-b border-slate-700">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question Palette</h3>
        </div>
        <div className="px-3 py-2.5 border-b border-slate-700 space-y-1.5">
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded shrink-0 ${testConfig['not_visited'].dotClass}`} />
              Not Visited
            </div>
            <span className="text-slate-300 font-medium tabular-nums">{notVisitedCount}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded shrink-0 ${testConfig['not_answered'].dotClass}`} />
              Not Answered
            </div>
            <span className="text-red-400 font-medium tabular-nums">{counts['not_answered'] ?? 0}</span>
          </div>
          <div className="flex items-center justify-between gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className={`w-5 h-5 rounded shrink-0 ${testConfig['answered'].dotClass}`} />
              Answered
            </div>
            <span className="text-green-400 font-medium tabular-nums">{counts['answered'] ?? 0}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
              const status = questionStatuses[num] as TestQuestionStatus | undefined;
              const resolvedStatus: TestQuestionStatus = status ?? 'not_visited';
              const cfg = testConfig[resolvedStatus];
              const isCurrent = num === currentQuestionNumber;
              return (
                <button
                  key={num}
                  onClick={() => onQuestionSelect(num)}
                  disabled={loading}
                  title={`Question ${num}: ${resolvedStatus.replace(/_/g, ' ')}`}
                  className={`w-full aspect-square rounded text-xs font-semibold transition text-white ${cfg.bgClass} ${isCurrent ? 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-800' : ''}`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-3 border-t border-slate-700 space-y-1 text-xs">
          <div className="flex justify-between text-slate-400">
            <span>Answered</span>
            <span className="text-green-400 font-semibold">{counts['answered'] ?? 0}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Not Answered</span>
            <span className="text-red-400 font-semibold">{counts['not_answered'] ?? 0}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Not Visited</span>
            <span className="text-slate-300 font-semibold">{notVisitedCount}</span>
          </div>
        </div>
      </div>
    );
  }

  // review mode
  const reviewConfig = config as Record<string, StatusConfig>;
  return (
    <div className="w-60 bg-slate-800 border-l border-slate-700 flex flex-col shrink-0">
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Question Palette</h3>
      </div>
      <div className="px-3 py-2.5 border-b border-slate-700 space-y-1.5">
        {(['correct', 'wrong', 'skipped'] as ReviewQuestionStatus[]).map((k) => {
          const cfg = reviewConfig[k];
          return (
            <div key={k} className="flex items-center justify-between gap-2 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded shrink-0 ${cfg.dotClass}`} />
                {cfg.label}
              </div>
              <span className={`${cfg.textClass} font-medium tabular-nums`}>{counts[k] ?? 0}</span>
            </div>
          );
        })}
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: totalQuestions }, (_, i) => i + 1).map((num) => {
            const status = (questionStatuses[num] as ReviewQuestionStatus | undefined) ?? 'skipped';
            const cfg = reviewConfig[status];
            const isCurrent = num === currentQuestionNumber;
            return (
              <button
                key={num}
                type="button"
                onClick={() => onQuestionSelect(num)}
                title={`Question ${num}`}
                className={`w-full aspect-square rounded text-xs font-semibold transition text-white ${cfg.bgClass} ${isCurrent ? 'ring-2 ring-pink-400 ring-offset-1 ring-offset-slate-800' : ''}`}
              >
                {num}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Exported component ───────────────────────────────────────────────────────
// Renders: left = section nav, middle = children (main content), right = question palette.

export default function TestSidebars(props: TestSidebarsProps & { children: ReactNode }) {
  const {
    sections, currentSection, sectionProgress, currentSubsection,
    onSectionChange, onSubsectionChange,
    totalQuestionsInSection, currentQuestionNumberInSection, onQuestionSelect,
    mode, questionStatuses, loading,
    children,
  } = props;

  return (
    <>
      <SectionNavigation
        sections={sections}
        currentSection={currentSection}
        sectionProgress={sectionProgress}
        currentSubsection={currentSubsection}
        onSectionChange={onSectionChange}
        onSubsectionChange={onSubsectionChange}
      />
      {children}
      <UnifiedQuestionPalette
        mode={mode}
        totalQuestions={totalQuestionsInSection}
        currentQuestionNumber={currentQuestionNumberInSection}
        questionStatuses={questionStatuses as Record<number, TestQuestionStatus | ReviewQuestionStatus>}
        loading={loading as boolean | undefined}
        onQuestionSelect={onQuestionSelect}
      />
    </>
  );
}
