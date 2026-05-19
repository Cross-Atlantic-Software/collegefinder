"use client";

import type { ExamField } from "@/lib/examDisplay";

type ExamInfoRowsProps = {
  fields: ExamField[];
  /** Tighter layout for dashboard cards */
  compact?: boolean;
  className?: string;
};

export function ExamInfoRows({ fields, compact = false, className = "" }: ExamInfoRowsProps) {
  if (fields.length === 0) return null;

  const labelClass = compact
    ? "text-[10px] text-slate-500 dark:text-slate-400"
    : "text-xs text-slate-500 dark:text-slate-400";
  const valueClass = compact
    ? "text-[10px] font-medium text-slate-800 dark:text-slate-200"
    : "text-sm text-slate-800 dark:text-slate-200";

  return (
    <dl className={`space-y-1.5 ${className}`}>
      {fields.map((item) => (
        <div
          key={item.label}
          className={
            compact
              ? "grid grid-cols-[minmax(0,38%)_minmax(0,1fr)] gap-x-2 gap-y-0.5"
              : "rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950"
          }
        >
          <dt className={labelClass}>{item.label}</dt>
          <dd className={`${valueClass} break-words`}>
            {item.label === "Website" ? (
              <a
                href={item.value.startsWith("http") ? item.value : `https://${item.value}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#b88900] underline-offset-2 hover:underline"
              >
                {item.value}
              </a>
            ) : (
              <span className="whitespace-pre-wrap">{item.value}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
