"use client";

import type { DashboardInstitute } from "@/api/auth/profile";
import { ExamCardFeatureTickIndicator } from "@/components/dashboard/ExamCardFeatureTickIndicator";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  instituteCardStatisticsFields,
  instituteLocationLine,
} from "@/lib/instituteDisplay";

type CoachingCardMetaFieldsProps = {
  institute: DashboardInstitute;
  /** Online institutes tab hides location on cards. */
  hideLocation?: boolean;
};

function MetaFieldRow({
  fields,
}: {
  fields: Array<{ label: string; value: string; tooltipValue?: string }>;
}) {
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

export function CoachingCardMetaFields({
  institute,
  hideLocation = false,
}: CoachingCardMetaFieldsProps) {
  const location = hideLocation ? null : instituteLocationLine(institute);
  const statsFields = instituteCardStatisticsFields(institute.statistics);
  const demoAvailable = institute.instituteDetails?.demo_available === true;
  const scholarshipAvailable = institute.instituteDetails?.scholarship_available === true;

  const infoFields: Array<{ label: string; value: string; tooltipValue?: string }> = [];
  if (location) {
    infoFields.push({ label: "Location", value: location });
  }
  if (institute.branches_number?.trim()) {
    infoFields.push({ label: "Branches", value: institute.branches_number.trim() });
  }
  if (institute.student_strength?.trim()) {
    infoFields.push({ label: "Student Strength", value: institute.student_strength.trim() });
  }

  const availabilityTicks: Array<{ label: string; tooltip: string }> = [];
  if (demoAvailable) {
    availabilityTicks.push({ label: "Demo Available", tooltip: "Demo Available: Yes" });
  }
  if (scholarshipAvailable) {
    availabilityTicks.push({
      label: "Scholarship Available",
      tooltip: "Scholarship Available: Yes",
    });
  }

  if (!infoFields.length && !statsFields.length && !availabilityTicks.length) {
    return null;
  }

  return (
    <div className="space-y-1.5">
      {infoFields.length ? <MetaFieldRow fields={infoFields} /> : null}
      {statsFields.length ? <MetaFieldRow fields={statsFields} /> : null}
      {availabilityTicks.length ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {availabilityTicks.map((item) => (
            <ExamCardFeatureTickIndicator
              key={item.label}
              label={item.label}
              tooltip={item.tooltip}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
