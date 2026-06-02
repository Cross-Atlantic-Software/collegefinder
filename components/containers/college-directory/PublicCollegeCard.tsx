"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeCardHeader } from "@/components/dashboard/CollegeCardHeader";
import { CollegeCardMetaFields } from "@/components/dashboard/CollegeCardMetaFields";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
import { collegeCardOverviewText } from "@/lib/collegeDisplay";

export type PublicCollegeCardProps = {
  college: DashboardCollege;
};

/** Public directory card — same layout as dashboard college cards, without shortlist or CTAs. */
export function PublicCollegeCard({ college }: PublicCollegeCardProps) {
  const displayOverview = collegeCardOverviewText(college);

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <CollegeCardHeader college={college} />

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        <CollegeCardMetaFields college={college} />

        <LinkedExamChips
          linkedExams={college.linkedExams}
          linkFrom="dashboard-college-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />
      </div>
    </article>
  );
}
