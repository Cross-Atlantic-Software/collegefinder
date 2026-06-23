"use client";

import { ExamCardNegativeMarkingIndicator } from "@/components/dashboard/ExamCardNegativeMarkingIndicator";

type ExamCardAttemptNegativeRowProps = {
  attemptLimit: string | null;
  negativeMarking: string | null;
};

/** Attempt limit + negative marking on one aligned row. */
export function ExamCardAttemptNegativeRow({
  attemptLimit,
  negativeMarking,
}: ExamCardAttemptNegativeRowProps) {
  if (!attemptLimit && !negativeMarking) return null;

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
      {attemptLimit ? (
        <span className="inline-flex min-w-0 max-w-full items-center text-slate-600 dark:text-slate-400">
          <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">Attempt Limit: </span>
          <span className="truncate">{attemptLimit}</span>
        </span>
      ) : null}
      {negativeMarking ? (
        <ExamCardNegativeMarkingIndicator value={negativeMarking} className="shrink-0" />
      ) : null}
    </div>
  );
}
