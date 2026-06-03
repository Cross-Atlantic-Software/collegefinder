"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeCardMetaFields } from "@/components/dashboard/CollegeCardMetaFields";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
  type LinkedExamChipsFrom,
} from "@/components/dashboard/LinkedExamChips";
import { collegeCardOverviewText } from "@/lib/collegeDisplay";

type CollegeCardFieldsProps = {
  college: DashboardCollege;
  linkFrom?: LinkedExamChipsFrom;
  /** Reserve space for optional rows so directory cards stay even when data is sparse. */
  reserveSpace?: boolean;
};

/** Shared college card body fields: overview, meta row, linked exams. */
export function CollegeCardFields({
  college,
  linkFrom = "dashboard-college-shortlist",
  reserveSpace = false,
}: CollegeCardFieldsProps) {
  const displayOverview = collegeCardOverviewText(college);

  const meta = <CollegeCardMetaFields college={college} />;
  const chips = (
    <LinkedExamChips
      linkedExams={college.linkedExams}
      linkFrom={linkFrom}
      maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
    />
  );

  return (
    <>
      <p
        className={`line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400${reserveSpace ? " min-h-[2.75rem]" : ""}`}
      >
        {displayOverview}
      </p>

      {reserveSpace ? <div className="min-h-5 shrink-0">{meta}</div> : meta}
      {reserveSpace ? <div className="min-h-6 shrink-0">{chips}</div> : chips}
    </>
  );
}
