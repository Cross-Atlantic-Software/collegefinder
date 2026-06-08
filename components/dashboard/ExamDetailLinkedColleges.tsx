"use client";

import Link from "next/link";
import { useState } from "react";
import type { DashboardCollege } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";
import { collegeCardSubtitle, collegeLocationLine, collegeOverviewText, collegeExamDetailStatsLine } from "@/lib/collegeDisplay";
import { slugifyCollegeName } from "@/lib/collegeSlug";

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

const PREVIEW_COUNT = 3;

function collegeLogo(c: DashboardCollege): string {
  return (
    resolveCollegeLogoSrc(c) ??
    LOCAL_COLLEGE_IMAGES[Math.abs(c.id) % LOCAL_COLLEGE_IMAGES.length]
  );
}

type ExamDetailLinkedCollegesProps = {
  colleges: DashboardCollege[];
  totalCount: number;
  isLoading?: boolean;
};

function CollegeCard({ college }: { college: DashboardCollege }) {
  return (
    <Link
      href={`/dashboard/colleges/${slugifyCollegeName(college.college_name)}?from=exam-detail`}
      className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F6F8FA] transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div className="relative aspect-[23/9] overflow-hidden bg-slate-200 dark:bg-slate-800">
        <img
          src={collegeLogo(college)}
          alt={college.college_name}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {college.college_name}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {collegeCardSubtitle(college) || college.college_type || "College"}
        </p>
        <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
          {collegeLocationLine(college) || "Location not listed"}
        </p>
        {collegeExamDetailStatsLine(college) ? (
          <p className="line-clamp-2 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {collegeExamDetailStatsLine(college)}
          </p>
        ) : null}
        {collegeOverviewText(college) ? (
          <p className="line-clamp-2 text-[11px] text-slate-500 dark:text-slate-400">
            {collegeOverviewText(college)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function ExamDetailLinkedColleges({
  colleges,
  totalCount,
  isLoading = false,
}: ExamDetailLinkedCollegesProps) {
  const [expanded, setExpanded] = useState(false);
  const count = Math.max(totalCount, colleges.length);
  const hasMore = count > PREVIEW_COUNT;
  const visibleColleges = expanded ? colleges : colleges.slice(0, PREVIEW_COUNT);

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Colleges you can get
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Colleges whose recommended exam includes this exam ({count} total).
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
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading colleges…</p>
      ) : count === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No colleges are linked to this exam yet. In admin, add this exam under the college&apos;s
          recommended exams (college or program level).
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleColleges.map((college) => (
            <CollegeCard key={college.id} college={college} />
          ))}
        </div>
      )}
    </article>
  );
}
