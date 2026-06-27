"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { CollegeCardHeader } from "@/components/dashboard/CollegeCardHeader";
import { CollegeCardMetaFields } from "@/components/dashboard/CollegeCardMetaFields";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";

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
  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="relative">
        <CollegeCardHeader college={college} />
        <div className="absolute right-2 top-2 z-10">
          <CardShortlistHeart
            isShortlisted={isShortlisted}
            shortlistSaving={shortlistSaving}
            onShortlist={onShortlist}
            itemLabel={college.college_name}
          />
        </div>
      </div>

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-3">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        <CollegeCardMetaFields college={college} />

        <LinkedExamChips
          linkedExams={college.linkedExams}
          linkFrom="dashboard-college-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />

        <div className="mt-auto pt-3">
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
