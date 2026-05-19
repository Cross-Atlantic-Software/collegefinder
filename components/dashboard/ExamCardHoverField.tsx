"use client";

import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";

type ExamCardHoverFieldProps = {
  label: string;
  value: string;
  className?: string;
};

/** Value-only line; hover/focus shows a small popup with "label: value". */
export function ExamCardHoverField({ label, value, className = "" }: ExamCardHoverFieldProps) {
  const tooltip = `${label}: ${value}`;

  return (
    <span className={`group/field relative inline-block max-w-full ${className}`}>
      <span
        className="line-clamp-2 cursor-default text-[11px] text-slate-600 dark:text-slate-400"
        tabIndex={0}
        aria-label={tooltip}
      >
        {value}
      </span>
      <ExamCardFieldTooltip text={tooltip} />
    </span>
  );
}
