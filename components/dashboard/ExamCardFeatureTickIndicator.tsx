"use client";

import { FaCheck } from "react-icons/fa";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";

type ExamCardFeatureTickIndicatorProps = {
  label: string;
  tooltip: string;
  className?: string;
};

/** Label + tick badge with hover tooltip (demo, scholarship, negative marking, etc.). */
export function ExamCardFeatureTickIndicator({
  label,
  tooltip,
  className = "",
}: ExamCardFeatureTickIndicatorProps) {
  return (
    <span
      className={`inline-flex min-w-0 max-w-full flex-wrap items-center gap-x-1 gap-y-0.5 text-[11px] text-slate-600 dark:text-slate-400 ${className}`}
    >
      <span className="shrink-0 font-medium text-slate-800 dark:text-slate-200">{label}:</span>
      <span className="group/field relative inline-flex shrink-0">
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
