"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardCollege } from "@/api/auth/profile";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";
import {
  collegeCardSubtitle,
  collegeExamDetailStatsLine,
  collegeLocationLine,
} from "@/lib/collegeDisplay";
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

function CollegeCard({ college }: { college: DashboardCollege }) {
  return (
    <Link
      href={`/dashboard/colleges/${slugifyCollegeName(college.college_name)}?from=exam-detail`}
      className="group flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F6F8FA] transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
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
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {college.college_name}
        </h3>
        <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
          {collegeCardSubtitle(college) || college.college_type || "College"}
        </p>
        <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
          {collegeLocationLine(college) || "Location not listed"}
        </p>
        {collegeExamDetailStatsLine(college) ? (
          <p className="line-clamp-1 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            {collegeExamDetailStatsLine(college)}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

type ExamDetailMappedCollegesProps = {
  colleges: DashboardCollege[];
  totalCount: number;
};

export function ExamDetailMappedColleges({
  colleges,
  totalCount,
}: ExamDetailMappedCollegesProps) {
  const [expanded, setExpanded] = useState(false);
  const count = Math.max(totalCount, colleges.length);
  if (count === 0 || colleges.length === 0) return null;

  const hasMore = colleges.length > PREVIEW_COUNT;
  const visible = expanded ? colleges : colleges.slice(0, PREVIEW_COUNT);

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Mapped Colleges
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Colleges that accept this exam ({count} total).
          </p>
        </div>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          >
            {expanded ? "Show less" : `+${colleges.length - PREVIEW_COUNT} more`}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50">
        {visible.map((college) => (
          <CollegeCard key={college.id} college={college} />
        ))}
      </div>
    </article>
  );
}
