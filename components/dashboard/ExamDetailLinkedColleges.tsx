"use client";

import Link from "next/link";
import type { DashboardCollege } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

const PREVIEW_COUNT = 3;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function collegeLogo(c: DashboardCollege): string {
  return (
    resolveCollegeLogoSrc(c) ??
    LOCAL_COLLEGE_IMAGES[Math.abs(c.id) % LOCAL_COLLEGE_IMAGES.length]
  );
}

function locationLine(c: DashboardCollege): string {
  return (
    c.college_location?.trim() ||
    [c.city, c.state].filter(Boolean).join(", ") ||
    "Location not listed"
  );
}

type ExamDetailLinkedCollegesProps = {
  colleges: DashboardCollege[];
  totalCount: number;
  isLoading?: boolean;
};

export function ExamDetailLinkedColleges({
  colleges,
  totalCount,
  isLoading = false,
}: ExamDetailLinkedCollegesProps) {
  const preview = colleges.slice(0, PREVIEW_COUNT);
  const showViewMore = totalCount > PREVIEW_COUNT;

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Colleges you can get
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Colleges whose recommended exam includes this exam ({totalCount} total).
          </p>
        </div>
        {showViewMore ? (
          <Button
            variant="themeButtonOutline"
            size="sm"
            href="/dashboard?section=college-shortlist&collegeTab=all"
            className="shrink-0 !rounded-full"
          >
            View more
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">Loading colleges…</p>
      ) : totalCount === 0 ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          No colleges are linked to this exam yet. In admin, add this exam under the college&apos;s
          recommended exams (college or program level).
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {preview.map((college) => (
            <Link
              key={college.id}
              href={`/dashboard/colleges/${slugify(college.college_name)}?from=exam-detail`}
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
                  {college.college_type || "College"}
                </p>
                <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
                  {locationLine(college)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
