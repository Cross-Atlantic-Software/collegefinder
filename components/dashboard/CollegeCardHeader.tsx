"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeLogo } from "@/components/dashboard/CollegeLogo";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";
import { collegeLocationLine } from "@/lib/collegeDisplay";

type CollegeCardHeaderProps = {
  college: DashboardCollege;
  borderClassName?: string;
  /** Tighter header for public directory cards (matches exam directory sizing). */
  compact?: boolean;
};

/** Shared college card top row: name, location · affiliation, type badge on logo. */
export function CollegeCardHeader({
  college,
  borderClassName = "border-slate-100 dark:border-slate-800",
  compact = false,
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

  const logoSide = compact ? (
    <div className="flex shrink-0 flex-col items-center gap-0.5">
      <CollegeLogo college={college} className="h-[60px] w-[60px] shrink-0 rounded-xl" />
    </div>
  ) : (
    <div className="relative shrink-0 overflow-visible pt-1.5">
      <CollegeLogo college={college} className="h-20 w-20 shrink-0 rounded-xl" />
    </div>
  );

  return (
    <div
      className={`flex items-start border-b px-3 ${compact ? "gap-2.5 pt-2 pb-1.5" : "gap-3 pt-4 pb-1"} ${borderClassName}`}
    >
      <div className="min-w-0 flex-1 space-y-1">
        <h3
          className={`line-clamp-2 text-xs font-semibold text-slate-900 dark:text-slate-100 ${compact ? "leading-tight" : "leading-snug"}`}
        >
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
        {typeBadgeLabel && collegeType ? (
          <div className="pt-0.5">
            <span className="group/field relative z-10 inline-block max-w-full">
              <span
                className={`${EXAM_CARD_CHIP_CLASS} block cursor-default border border-slate-200/80 px-2 py-0.5 text-center text-[9px] font-semibold leading-tight shadow-sm dark:border-slate-600`}
                tabIndex={0}
                aria-label={`College type: ${collegeType}`}
              >
                {typeBadgeLabel}
              </span>
              <ExamCardFieldTooltip text={`College type: ${collegeType}`} />
            </span>
          </div>
        ) : null}
      </div>
      {logoSide}
    </div>
  );
}
