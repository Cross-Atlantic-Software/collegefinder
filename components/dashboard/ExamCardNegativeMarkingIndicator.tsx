"use client";

import { FaCheck } from "react-icons/fa";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";

type ExamCardNegativeMarkingIndicatorProps = {
  value: string;
  className?: string;
};

/** "Negative marking:" + tick; same tooltip wrapper as ExamCardHoverField (hover the tick). */
export function ExamCardNegativeMarkingIndicator({
  value,
  className = "",
}: ExamCardNegativeMarkingIndicatorProps) {
  const tooltip = `Negative Marking: ${value}`;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 text-[11px] text-slate-600 dark:text-slate-400 ${className}`}
    >
      <span className="font-medium text-slate-800 dark:text-slate-200">Negative Marking:</span>
      <span className="group/field relative inline-block">
        <span
          className="inline-flex h-4 w-4 cursor-default items-center justify-center rounded-full border border-black bg-black text-[#FAD53C] outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1 dark:border-black dark:bg-black dark:text-[#FAD53C]"
          tabIndex={0}
          aria-label={tooltip}
        >
          <FaCheck className="h-2.5 w-2.5" aria-hidden />
        </span>
        <ExamCardFieldTooltip text={tooltip} />
      </span>
    </span>
  );
}
