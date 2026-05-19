"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { Exam } from "@/api/exams";
import { Button } from "@/components/shared";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import {
  examCardConductingAuthority,
  examCardOverview,
  examCardStreamLine,
  examCardTagChips,
  examCardTypeLabel,
} from "@/lib/examDisplay";

export type ExamShortlistCardProps = {
  exam: Exam;
  name: string;
  detailHref: string;
  tabSource: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
  onApply: () => void;
  onPrefetchDetail?: () => void;
};

export function ExamShortlistCard({
  exam,
  name,
  detailHref,
  tabSource,
  isShortlisted,
  shortlistSaving,
  onShortlist,
  onApply,
  onPrefetchDetail,
}: ExamShortlistCardProps) {
  const examType = examCardTypeLabel(exam);
  const conductingAuthority = examCardConductingAuthority(exam);
  const overview = examCardOverview(exam);
  const chips = examCardTagChips(exam);
  const stream = examCardStreamLine(exam);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {name}
          </h3>
          {conductingAuthority ? (
            <p className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Conducting authority:{" "}
              </span>
              {conductingAuthority}
            </p>
          ) : null}
          {examType ? (
            <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
              <span className="font-medium text-slate-800 dark:text-slate-200">Exam type: </span>
              {examType}
            </p>
          ) : null}
        </div>
        <ExamLogo exam={exam} className="h-16 w-16 shrink-0 p-1.5" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
        <div className="flex items-center justify-end">
          <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {tabSource}
          </span>
        </div>

        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {overview}
        </p>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span
                key={chip}
                className="max-w-full truncate rounded-full bg-[#f0f4fa] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                title={chip}
              >
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        {stream ? (
          <p className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-medium text-slate-800 dark:text-slate-200">Stream: </span>
            {stream}
          </p>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button
            variant="themeButtonOutline"
            size="sm"
            href={detailHref}
            onMouseEnter={onPrefetchDetail}
            onFocus={onPrefetchDetail}
            className="min-w-[72px] flex-1 justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          >
            View
          </Button>
          <button
            type="button"
            onClick={onShortlist}
            disabled={shortlistSaving}
            className={`inline-flex min-w-[88px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              isShortlisted
                ? "border border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "border border-black bg-black text-[#FAD53C] hover:bg-black/90"
            }`}
          >
            {shortlistSaving ? (
              "Saving..."
            ) : isShortlisted ? (
              <>
                <FaHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Shortlisted
              </>
            ) : (
              <>
                <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Shortlist
              </>
            )}
          </button>
          <Button
            variant="themeButton"
            size="sm"
            type="button"
            onClick={onApply}
            className="min-w-[72px] flex-1 justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
          >
            Apply
          </Button>
        </div>
      </div>
    </article>
  );
}
