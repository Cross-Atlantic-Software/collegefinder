"use client";

import type { DashboardScholarship } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
import { ScholarshipLogo } from "@/components/dashboard/ScholarshipLogo";
import { scholarshipLinkedCollegeLocation } from "@/lib/scholarshipDisplay";

export type ScholarshipShortlistCardProps = {
  scholarship: DashboardScholarship;
  detailHref: string;
  displayOverview: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
};

type MetaField = { label: string; value: string };

export function ScholarshipShortlistCard({
  scholarship,
  detailHref,
  displayOverview,
  isShortlisted,
  shortlistSaving,
  onShortlist,
}: ScholarshipShortlistCardProps) {
  const collegeLocation = scholarshipLinkedCollegeLocation(scholarship);
  const scholarshipType = scholarship.scholarship_type?.trim();
  const authority = scholarship.conducting_authority?.trim();
  const amount = scholarship.scholarship_amount?.trim();
  const mode = scholarship.mode?.trim();
  const streamName = scholarship.stream_name?.trim();

  const metaFields: MetaField[] = [];
  if (authority && scholarshipType) {
    metaFields.push({ label: "Conducting authority", value: authority });
  }
  if (amount) metaFields.push({ label: "Amount", value: amount });
  if (mode) metaFields.push({ label: "Mode", value: mode });
  if (streamName) metaFields.push({ label: "Stream", value: streamName });
  if (collegeLocation) {
    metaFields.push({ label: "Linked college location", value: collegeLocation });
  }

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {scholarship.scholarship_name}
          </h3>
          {scholarshipType ? (
            <p>
              <ExamCardHoverField label="Scholarship type" value={scholarshipType} />
            </p>
          ) : !scholarshipType && authority ? (
            <p>
              <ExamCardHoverField label="Conducting authority" value={authority} />
            </p>
          ) : null}
        </div>
        <ScholarshipLogo scholarship={scholarship} className="h-16 w-16 shrink-0 p-1.5" />
      </div>

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <div className="absolute right-2 top-2 z-10">
          <CardShortlistHeart
            isShortlisted={isShortlisted}
            shortlistSaving={shortlistSaving}
            onShortlist={onShortlist}
            itemLabel={scholarship.scholarship_name}
          />
        </div>

        <p className="line-clamp-3 pr-8 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        {metaFields.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {metaFields.map((field, index) => (
              <span key={field.label} className="inline-flex max-w-full items-center gap-2">
                {index > 0 ? (
                  <span
                    className="hidden text-slate-300 sm:inline dark:text-slate-600"
                    aria-hidden
                  >
                    ·
                  </span>
                ) : null}
                <ExamCardHoverField label={field.label} value={field.value} />
              </span>
            ))}
          </div>
        ) : null}

        <LinkedExamChips
          linkedExams={scholarship.linkedExams}
          linkFrom="dashboard-scholarship-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="themeButtonOutline"
              size="sm"
              href={detailHref}
              className="w-full justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View
            </Button>
            <Button
              variant="themeButton"
              size="sm"
              href="/dashboard?section=applications"
              className="w-full justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
            >
              Apply
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
