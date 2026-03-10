'use client'
import { Button } from "@/components/shared";

export interface SubmitSummary {
  attempted: number;
  skipped: number;
  unattempted: number;
  total: number;
}

interface EndTestConfirmationProps {
  completingTest: boolean;
  error: string | null;
  summary: SubmitSummary;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EndTestConfirmation({
  completingTest,
  error,
  summary,
  onCancel,
  onConfirm,
}: EndTestConfirmationProps) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-2">Submit Test?</h3>
        <p className="text-slate-300 text-sm mb-4">
          Are you sure you want to submit your test? Once submitted, you cannot change your answers.
        </p>
        <div className="mb-6 rounded-lg bg-slate-700/60 border border-slate-600 p-4 space-y-2">
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-2">Question summary</p>
          <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
            <span className="text-green-400">
              <strong>{summary.attempted}</strong> attempted
            </span>
            <span className="text-amber-400">
              <strong>{summary.skipped}</strong> skipped
            </span>
            <span className="text-slate-400">
              <strong>{summary.unattempted}</strong> unattempted
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            Total: {summary.total} questions
          </p>
        </div>
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="themeButtonOutline"
            disabled={completingTest}
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="themeButton"
            disabled={completingTest}
            className="bg-green-600 hover:bg-green-700"
          >
            {completingTest ? 'Submitting...' : 'Yes, Submit Test'}
          </Button>
        </div>
      </div>
    </div>
  );
}
