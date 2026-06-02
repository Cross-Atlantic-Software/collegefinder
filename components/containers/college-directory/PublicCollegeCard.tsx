"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeCardHeader } from "@/components/dashboard/CollegeCardHeader";
import { CollegeCardMetaFields } from "@/components/dashboard/CollegeCardMetaFields";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
import { collegeCardOverviewText } from "@/lib/collegeDisplay";
import { directoryCardBgClass } from "@/components/containers/exam-directory/directoryCardTones";

export type PublicCollegeCardProps = {
  college: DashboardCollege;
  toneIndex?: number;
};

export function PublicCollegeCard({ college, toneIndex = 0 }: PublicCollegeCardProps) {
  const overview = collegeCardOverviewText(college);
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <article
      className={`flex h-full flex-col overflow-visible rounded-2xl shadow-sm ring-1 ring-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
    >
      <CollegeCardHeader college={college} borderClassName="border-black/10" />

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600">{overview}</p>

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
