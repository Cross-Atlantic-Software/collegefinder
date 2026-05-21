"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { DashboardCollege } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { CollegeLogo } from "@/components/dashboard/CollegeLogo";
import { collegeLocationLine } from "@/lib/collegeDisplay";

export type CollegeShortlistCardProps = {
  college: DashboardCollege;
  detailHref: string;
  displayOverview: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
};

export function CollegeShortlistCard({
  college,
  detailHref,
  displayOverview,
  isShortlisted,
  shortlistSaving,
  onShortlist,
}: CollegeShortlistCardProps) {
  const location = collegeLocationLine(college);
  const collegeType = college.college_type?.trim();

  const examChips = (college.linkedExams ?? []).slice(0, 4).map((ex) => ({
    key: ex.id,
    label: ex.code?.trim() || ex.name,
    title: ex.name,
  }));

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {college.college_name}
          </h3>
          {collegeType ? (
            <p>
              <ExamCardHoverField label="College type" value={collegeType} />
            </p>
          ) : null}
        </div>
        <CollegeLogo college={college} className="h-16 w-16 shrink-0 p-1.5" />
      </div>

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        {location ? (
          <p className="m-0">
            <ExamCardHoverField label="Location" value={location} />
          </p>
        ) : null}

        {examChips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {examChips.map((chip) => (
              <span key={chip.key} className={EXAM_CARD_CHIP_CLASS} title={chip.title}>
                {chip.label}
              </span>
            ))}
            {(college.linkedExams?.length ?? 0) > 4 ? (
              <span className={EXAM_CARD_CHIP_CLASS}>
                +{(college.linkedExams?.length ?? 0) - 4}
              </span>
            ) : null}
          </div>
        ) : null}

        {college.parent_university?.trim() ? (
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400" title={college.parent_university}>
            {college.parent_university}
          </p>
        ) : null}

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="themeButtonOutline"
              size="sm"
              href={detailHref}
              className="w-full justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View
            </Button>
            <Button
              variant="themeButton"
              size="sm"
              href="/dashboard?section=applications"
              className="w-full justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
            >
              Apply
            </Button>
          </div>
          <button
            type="button"
            onClick={onShortlist}
            disabled={shortlistSaving}
            aria-pressed={isShortlisted}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isShortlisted
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {shortlistSaving ? (
              "Saving..."
            ) : isShortlisted ? (
              <>
                <FaHeart
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                Shortlisted
              </>
            ) : (
              <>
                <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Shortlist college
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
