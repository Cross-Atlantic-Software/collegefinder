"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeCardFields } from "@/components/dashboard/CollegeCardFields";
import { CollegeCardHeader } from "@/components/dashboard/CollegeCardHeader";
import {
  DIRECTORY_CARD_MIN_HEIGHT_CLASS,
  directoryCardBgClass,
} from "@/components/containers/exam-directory/directoryCardTones";

export type PublicCollegeCardProps = {
  college: DashboardCollege;
  /** Alternates playbook card colors: blue (#cfe0f1) and amber. */
  toneIndex?: number;
};

/** Public directory card — matches exam directory layout, without shortlist or CTAs. */
export function PublicCollegeCard({ college, toneIndex = 0 }: PublicCollegeCardProps) {
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <article
      className={`flex h-full ${DIRECTORY_CARD_MIN_HEIGHT_CLASS} min-h-0 flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
    >
      <CollegeCardHeader college={college} borderClassName="border-black/10" compact />

      <div className="flex min-h-0 flex-1 flex-col gap-2 p-3 pt-2.5">
        <CollegeCardFields
          college={college}
          linkFrom="dashboard-college-shortlist"
          reserveSpace
        />
      </div>
    </article>
  );
}
