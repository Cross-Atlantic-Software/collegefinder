"use client";

import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";

type ExamCardHoverFieldProps = {
  label: string;
  value: string;
  className?: string;
  variant?: "inline" | "chip";
  /** Tighter single-line stack for card headers. */
  compact?: boolean;
};

/** Value-only line or chip; hover/focus shows a small popup with "label: value". */
export function ExamCardHoverField({
  label,
  value,
  className = "",
  variant = "inline",
  compact = false,
}: ExamCardHoverFieldProps) {
  const tooltip = `${label}: ${value}`;
  const valueClass =
    variant === "chip"
      ? `${EXAM_CARD_CHIP_CLASS} inline-block max-w-full cursor-default truncate`
      : compact
        ? "block cursor-default truncate text-[11px] leading-none text-slate-600 dark:text-slate-400"
        : "line-clamp-2 cursor-default text-[11px] leading-snug text-slate-600 dark:text-slate-400";

  return (
    <span
      className={`group/field relative max-w-full ${
        variant === "chip" || !compact ? "inline-block" : "block"
      } ${className}`}
    >
      <span className={valueClass} tabIndex={0} aria-label={tooltip}>
        {value}
      </span>
      <ExamCardFieldTooltip text={tooltip} />
    </span>
  );
}
