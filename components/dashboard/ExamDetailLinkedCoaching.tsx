"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashboardInstitute } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { InstituteLogo } from "@/components/dashboard/InstituteLogo";
import {
  instituteCardOverviewText,
  instituteExamDetailStatsLine,
  instituteLocationLine,
  instituteModeLabel,
} from "@/lib/instituteDisplay";
import { slugifyInstituteName } from "@/lib/instituteSlug";

const PREVIEW_COUNT = 3;

type ExamDetailLinkedCoachingProps = {
  institutes: DashboardInstitute[];
  totalCount: number;
  isLoading?: boolean;
};

function CoachingCard({ institute }: { institute: DashboardInstitute }) {
  const mode = instituteModeLabel(institute.type);
  const statsLine = instituteExamDetailStatsLine(institute);

  return (
    <Link
      href={`/dashboard/institutes/${slugifyInstituteName(institute.institute_name)}?from=exam-detail`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F6F8FA] transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="flex gap-3 p-3">
        <InstituteLogo institute={institute} className="h-16 w-16 shrink-0 p-1.5" />
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
            {institute.institute_name}
          </h3>
          {mode ? (
            <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{mode}</p>
          ) : null}
          <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
            {instituteLocationLine(institute) || "Location not listed"}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 border-t border-slate-200 p-3 dark:border-slate-800">
        {statsLine ? (
          <p className="line-clamp-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {statsLine}
          </p>
        ) : null}
        <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
          {instituteCardOverviewText(institute)}
        </p>
      </div>
    </Link>
  );
}

export function ExamDetailLinkedCoaching({
  institutes,
  totalCount,
  isLoading = false,
}: ExamDetailLinkedCoachingProps) {
  const [expanded, setExpanded] = useState(false);
  const count = Math.max(totalCount, institutes.length);
  const hasMore = count > PREVIEW_COUNT;
  const visibleInstitutes = expanded ? institutes : institutes.slice(0, PREVIEW_COUNT);

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Coaching institutes
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Coachings that offer or specialize in this exam ({count} total).
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

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading coaching institutes…</p>
      ) : count === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No coaching institutes are linked to this exam yet. In admin, map exams under Coaching
          Institutes or Coaching Exams mapping.
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleInstitutes.map((institute) => (
            <CoachingCard key={institute.id} institute={institute} />
          ))}
        </div>
      )}
    </article>
  );
}
