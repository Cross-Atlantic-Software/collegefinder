'use client'
import { Button } from "@/components/shared";

interface EndTestConfirmationProps {
  completingTest: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function EndTestConfirmation({
  completingTest,
  error,
  onCancel,
  onConfirm,
}: EndTestConfirmationProps) {
  return (
    <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center">
      <div className="bg-slate-800 rounded-lg p-6 max-w-md mx-4 border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-2">Submit Test?</h3>
        <p className="text-slate-300 text-sm mb-6">
          Are you sure you want to submit your test? Once submitted, you cannot change your answers.
        </p>
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
