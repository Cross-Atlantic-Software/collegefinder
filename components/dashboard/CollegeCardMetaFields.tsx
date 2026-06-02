"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";

type CollegeCardMetaFieldsProps = {
  college: DashboardCollege;
};

export function CollegeCardMetaFields({ college }: CollegeCardMetaFieldsProps) {
  const nirf =
    college.nirf_ranking != null && Number.isFinite(Number(college.nirf_ranking))
      ? Number(college.nirf_ranking)
      : null;
  const timelineFull = college.admission_timeline?.trim() || null;
  const timelineDisplay = timelineFull
    ? timelineFull.length > 60
      ? `${timelineFull.slice(0, 57)}…`
      : timelineFull
    : null;

  const fields: Array<{ label: string; value: string; tooltipValue?: string }> = [];
  if (nirf != null) {
    fields.push({ label: "NIRF ranking", value: `#${nirf}` });
  }
  if (timelineDisplay) {
    fields.push({
      label: "Admission timeline",
      value: timelineDisplay,
      tooltipValue: timelineFull ?? timelineDisplay,
    });
  }

  if (!fields.length) return null;

  return (
    <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      {fields.map((field, index) => (
        <span key={field.label} className="inline-flex min-w-0 max-w-full items-center gap-2">
          {index > 0 ? (
            <span className="shrink-0 text-slate-300 dark:text-slate-600" aria-hidden>
              ·
            </span>
          ) : null}
          <ExamCardHoverField
            label={field.label}
            value={field.value}
            tooltipValue={field.tooltipValue}
            className={index > 0 ? "min-w-0 max-w-full" : "shrink-0"}
          />
        </span>
      ))}
    </div>
  );
}
