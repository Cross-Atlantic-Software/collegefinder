"use client";

import Link from "next/link";
import { useState } from "react";
import type { ExamLinkedScholarshipPreview } from "@/api/exams";
import { Button } from "@/components/shared";
import { scholarshipDetailHref } from "@/lib/scholarshipSlug";

const PREVIEW_COUNT = 3;

type ExamDetailLinkedScholarshipsProps = {
  scholarships: ExamLinkedScholarshipPreview[];
  totalCount: number;
  /** When true, renders as a subsection inside Mapping (no outer card). */
  embedded?: boolean;
};

function ScholarshipCard({ scholarship }: { scholarship: ExamLinkedScholarshipPreview }) {
  const subtitle =
    scholarship.scholarship_type?.trim() ||
    scholarship.conducting_authority?.trim() ||
    "Scholarship";
  const amount = scholarship.scholarship_amount?.trim();

  return (
    <Link
      href={scholarshipDetailHref(scholarship.scholarship_name, "exam-detail")}
      className="group flex flex-col rounded-xl border border-slate-200 bg-[#F6F8FA] p-4 transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
        {scholarship.scholarship_name}
      </h3>
      <p className="mt-1 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      {amount ? (
        <p className="mt-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">{amount}</p>
      ) : null}
    </Link>
  );
}

export function ExamDetailLinkedScholarships({
  scholarships,
  totalCount,
  embedded = false,
}: ExamDetailLinkedScholarshipsProps) {
  const [expanded, setExpanded] = useState(false);
  const count = Math.max(totalCount, scholarships.length);
  const hasMore = count > PREVIEW_COUNT;
  const visibleScholarships = expanded ? scholarships : scholarships.slice(0, PREVIEW_COUNT);

  const heading = (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3
          className={
            embedded
              ? "text-sm font-semibold text-slate-900 dark:text-slate-100"
              : "text-base font-semibold text-slate-900 dark:text-slate-100"
          }
        >
          Scholarships
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {count > 0
            ? `Scholarships tagged to this exam in admin mapping (${count} total).`
            : "Scholarships linked to this exam via admin mapping."}
        </p>
      </div>
      {hasMore ? (
        <Button
          type="button"
          variant="themeButtonOutline"
          size="sm"
          className="shrink-0 !rounded-full"
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Show less" : "View more"}
        </Button>
      ) : null}
    </div>
  );

  const body =
    count === 0 ? (
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        No scholarships are linked to this exam yet. In admin, map this exam under{" "}
        <span className="font-medium text-slate-700 dark:text-slate-300">
          Mapping → Scholarship exams &amp; colleges
        </span>
        .
      </p>
    ) : (
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visibleScholarships.map((scholarship) => (
          <ScholarshipCard key={scholarship.id} scholarship={scholarship} />
        ))}
      </div>
    );

  if (embedded) {
    return (
      <section>
        {heading}
        {body}
      </section>
    );
  }

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      {heading}
      {body}
    </article>
  );
}
