"use client";

import type { DashboardScholarship } from "@/api/auth/profile";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { scholarshipCardMetaFields } from "@/lib/scholarshipDisplay";

type ScholarshipCardMetaFieldsProps = {
  scholarship: DashboardScholarship;
  /** When mode is shown in the card header, scholarship type moves to this row. */
  showScholarshipType?: boolean;
};

export function ScholarshipCardMetaFields({
  scholarship,
  showScholarshipType = true,
}: ScholarshipCardMetaFieldsProps) {
  const fields = scholarshipCardMetaFields(scholarship, { showScholarshipType });
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
