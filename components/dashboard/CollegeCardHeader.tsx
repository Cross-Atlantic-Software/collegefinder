"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeLogo } from "@/components/dashboard/CollegeLogo";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";
import { collegeLocationLine } from "@/lib/collegeDisplay";

type CollegeCardHeaderProps = {
  college: DashboardCollege;
  borderClassName?: string;
};

/** Shared college card top row: name, location · affiliation, type badge on logo. */
export function CollegeCardHeader({
  college,
  borderClassName = "border-slate-100 dark:border-slate-800",
}: CollegeCardHeaderProps) {
  const location = collegeLocationLine(college);
  const university = college.parent_university?.trim();
  const collegeType = college.college_type?.trim();
  const subtitleParts = [location, university].filter(Boolean);

  const typeBadgeLabel = collegeType
    ? collegeType.includes(",")
      ? collegeType.split(",")[0].trim()
      : collegeType
    : null;

  return (
    <div className={`flex gap-3 border-b px-3 pt-4 pb-1 ${borderClassName}`}>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
          {college.college_name}
        </h3>
        {subtitleParts.length > 0 ? (
          <p
            className="line-clamp-2 text-[11px] leading-snug text-slate-500 dark:text-slate-400"
            title={subtitleParts.join(" · ")}
          >
            {subtitleParts.join(" · ")}
          </p>
        ) : null}
      </div>
      <div className="relative shrink-0 overflow-visible pt-1.5">
        {typeBadgeLabel && collegeType ? (
          <span className="group/field absolute left-1/2 top-0 z-10 max-w-[4.75rem] -translate-x-1/2 -translate-y-1/2 pb-2">
            <span
              className={`${EXAM_CARD_CHIP_CLASS} block cursor-default border border-slate-200/80 text-center text-[9px] font-semibold leading-tight shadow-sm dark:border-slate-600`}
              tabIndex={0}
              aria-label={`College type: ${collegeType}`}
            >
              {typeBadgeLabel}
            </span>
            <ExamCardFieldTooltip text={`College type: ${collegeType}`} />
          </span>
        ) : null}
        <CollegeLogo college={college} className="h-16 w-16 shrink-0 p-1.5" />
      </div>
    </div>
  );
}
