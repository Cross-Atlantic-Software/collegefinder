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
    <div className="flex flex-nowrap items-center gap-x-3 text-[11px]">
      {attemptLimit ? (
        <span className="inline-flex shrink-0 items-center whitespace-nowrap text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">Attempt Limit: </span>
          <span>{attemptLimit}</span>
        </span>
      ) : null}
      {negativeMarking ? (
        <ExamCardNegativeMarkingIndicator value={negativeMarking} />
      ) : null}
    </div>
  );
}
