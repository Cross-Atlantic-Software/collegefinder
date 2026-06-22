"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { CollegeLogo } from "@/components/dashboard/CollegeLogo";
import { ExamCardFieldTooltip } from "@/components/dashboard/examCardFieldTooltip";
import { collegeLocationLine } from "@/lib/collegeDisplay";
import { FaMapMarkerAlt } from "react-icons/fa";

type CollegeCardHeaderProps = {
  college: DashboardCollege;
  borderClassName?: string;
  /** Tighter header for public directory cards (matches exam directory sizing). */
  compact?: boolean;
};

/** Shared college card top row: full width banner image with title and subtitle overlay. */
export function CollegeCardHeader({
  college,
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

  return (
    <div className={`relative w-full shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-800 ${compact ? "h-24" : "h-32"} rounded-t-2xl`}>
      <CollegeLogo 
        college={college} 
        className="absolute inset-0 h-full w-full" 
        imageClassName="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      
      {typeBadgeLabel && collegeType ? (
        <div className="absolute left-2 top-2">
          <span className="group/field relative z-10 inline-block">
            <span
              className="inline-flex items-center rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-center text-[9px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-md dark:border-slate-600 dark:bg-black/60"
              tabIndex={0}
              aria-label={`College type: ${collegeType}`}
            >
              {typeBadgeLabel}
            </span>
            <ExamCardFieldTooltip text={`College type: ${collegeType}`} />
          </span>
        </div>
      ) : null}

      <div className="absolute bottom-3 left-3 pr-4 text-white">
        <h3 className="line-clamp-1 text-[15px] font-bold leading-tight drop-shadow-sm">
          {college.college_name}
        </h3>
        {subtitleParts.length > 0 ? (
          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/80 drop-shadow-sm" title={subtitleParts.join(" · ")}>
            <FaMapMarkerAlt className="h-3 w-3 shrink-0" />
            <span className="truncate">{subtitleParts.join(" · ")}</span>
          </p>
        ) : null}
      </div>
    </div>
  );
}
