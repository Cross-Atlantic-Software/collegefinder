"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { DashboardLinkedExam } from "@/api/auth/profile";
import { examDetailHref } from "@/lib/examDisplay";

type DetailRecommendedExamsCTAProps = {
  linkedExams?: DashboardLinkedExam[];
  linkFrom: string;
  subtitle?: string;
};

export function DetailRecommendedExamsCTA({
  linkedExams = [],
  linkFrom,
  subtitle = "Linked to this profile.",
}: DetailRecommendedExamsCTAProps) {
  const examCards = useMemo(
    () =>
      linkedExams.map((ex) => ({
        id: ex.id,
        exam: ex.code?.trim() || ex.name,
        track:
          ex.code?.trim() && ex.name?.trim() && ex.code.trim() !== ex.name.trim()
            ? ex.name
            : "Linked exam",
        reason: "Recommended or required for this coaching institute.",
        href: examDetailHref(ex.id, linkFrom),
      })),
    [linkedExams, linkFrom]
  );

  const [activeIndex, setActiveIndex] = useState(0);

  if (!examCards.length) return null;

  return (
    <article className="min-w-0 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Recommended Exams
          </h3>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
        </div>
        {examCards.length > 1 ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.max(0, i - 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
              disabled={activeIndex === 0}
              aria-label="Previous exam"
            >
              <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => setActiveIndex((i) => Math.min(examCards.length - 1, i + 1))}
              className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white ring-1 ring-slate-200 transition hover:ring-black disabled:opacity-30 dark:bg-slate-800 dark:ring-slate-700"
              disabled={activeIndex === examCards.length - 1}
              aria-label="Next exam"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 overflow-hidden rounded-xl">
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${activeIndex * 100}%)` }}
        >
          {examCards.map((item) => (
            <div
              key={item.id}
              className="w-full shrink-0 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                  {item.exam}
                </p>
                <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                  Linked
                </span>
              </div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                {item.track}
              </p>
              <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {item.reason}
              </p>
              <Link
                href={item.href}
                className="mt-2 inline-flex items-center gap-1 rounded-full bg-black px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-neutral-800"
              >
                View Exam <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          ))}
        </div>

        {examCards.length > 1 ? (
          <div className="mt-2 flex items-center justify-center gap-1.5">
            {examCards.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveIndex(idx)}
                aria-label={`Show exam ${idx + 1}`}
                className={`relative h-1 overflow-hidden rounded-full transition-all ${
                  idx === activeIndex ? "w-8 bg-[#FAD53C]/30" : "w-1.5 bg-slate-200 dark:bg-slate-700"
                }`}
              >
                {idx === activeIndex ? (
                  <span className="absolute inset-y-0 left-0 w-full rounded-full bg-[#FAD53C]" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
