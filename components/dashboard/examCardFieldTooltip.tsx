"use client";

/** Shared exam-card field popup (conducting authority, exam type, negative marking). */
export const EXAM_CARD_FIELD_TOOLTIP_CLASS =
  "pointer-events-none absolute left-0 top-full z-50 mt-1 w-max max-w-[14rem] scale-95 whitespace-normal rounded-md bg-slate-900 px-2 py-1 text-[10px] font-medium leading-snug text-white opacity-0 shadow-md transition-all duration-150 group-hover/field:scale-100 group-hover/field:opacity-100 group-focus-within/field:scale-100 group-focus-within/field:opacity-100 dark:bg-slate-100 dark:text-slate-900";

type ExamCardFieldTooltipProps = {
  text: string;
};

export function ExamCardFieldTooltip({ text }: ExamCardFieldTooltipProps) {
  return (
    <span role="tooltip" className={EXAM_CARD_FIELD_TOOLTIP_CLASS}>
      {text}
    </span>
  );
}
