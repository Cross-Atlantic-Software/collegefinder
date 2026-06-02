"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
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
        <div className="absolute right-2 top-2 z-10">
          <CardShortlistHeart
            isShortlisted={isShortlisted}
            shortlistSaving={shortlistSaving}
            onShortlist={onShortlist}
            itemLabel={college.college_name}
          />
        </div>

        <p className="line-clamp-3 pr-8 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        {location ? (
          <p className="m-0">
            <ExamCardHoverField label="Location" value={location} />
          </p>
        ) : null}

        <LinkedExamChips
          linkedExams={college.linkedExams}
          linkFrom="dashboard-college-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />

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
        </div>
      </div>
    </article>
  );
}
