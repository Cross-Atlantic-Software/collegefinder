"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { CollegeLogo } from "@/components/dashboard/CollegeLogo";
import { collegeCardOverviewText, collegeLocationLine } from "@/lib/collegeDisplay";
import { directoryCardBgClass } from "@/components/containers/exam-directory/directoryCardTones";

export type PublicCollegeCardProps = {
  college: DashboardCollege;
  toneIndex?: number;
};

export function PublicCollegeCard({ college, toneIndex = 0 }: PublicCollegeCardProps) {
  const location = collegeLocationLine(college);
  const collegeType = college.college_type?.trim();
  const overview = collegeCardOverviewText(college);
  const linkedExamLabels = (college.linkedExams ?? [])
    .map((e) => e.code?.trim() || e.name)
    .filter(Boolean)
    .slice(0, 3);
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
    >
      <div className="flex gap-3 border-b border-black/10 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">
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

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600">{overview}</p>

        {location ? (
          <p className="m-0">
            <ExamCardHoverField label="Location" value={location} />
          </p>
        ) : null}

        {linkedExamLabels.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {linkedExamLabels.map((label) => (
              <span key={label} className={EXAM_CARD_CHIP_CLASS} title={label}>
                {label}
              </span>
            ))}
          </div>
        ) : null}

        {college.parent_university?.trim() ? (
          <p
            className="truncate text-[11px] text-slate-500"
            title={college.parent_university}
          >
            {college.parent_university}
          </p>
        ) : null}
      </div>
    </article>
  );
}
