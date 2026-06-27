"use client";

import { useState } from "react";
import Link from "next/link";
import { collegeDetailHref } from "@/lib/collegeSlug";

type LinkedCollege = {
  id: number;
  name: string;
  city?: string | null;
  state?: string | null;
};

const INITIAL_COUNT = 3;
const BATCH_SIZE = 3;

// Linked colleges on a scholarship carry no logo, so each card uses a gradient cover.
const COVER_GRADIENTS = [
  "from-[#341050] to-[#7c3aed]",
  "from-[#0f766e] to-[#22d3ee]",
  "from-[#b45309] to-[#f59e0b]",
  "from-[#9d174d] to-[#fb7185]",
];

function collegeInitials(name: string): string {
  const letters = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("");
  return letters.toUpperCase() || "C";
}

function CollegeCard({ college, idx }: { college: LinkedCollege; idx: number }) {
  const location = [college.city, college.state]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  const gradient = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];

  return (
    <Link
      href={collegeDetailHref(college.name, "dashboard-scholarship-shortlist")}
      className="group flex w-60 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F6F8FA] transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        className={`relative flex aspect-[23/9] w-full items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <span className="text-lg font-bold uppercase tracking-wide text-white">
          {collegeInitials(college.name)}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {college.name}
        </h3>
        <p className="line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
          {location || "Location not listed"}
        </p>
      </div>
    </Link>
  );
}

type ScholarshipMappedCollegesProps = {
  colleges: LinkedCollege[];
};

export function ScholarshipMappedColleges({ colleges }: ScholarshipMappedCollegesProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);
  if (!colleges.length) return null;

  const visible = colleges.slice(0, visibleCount);
  const hasMore = visibleCount < colleges.length;
  const remaining = colleges.length - visibleCount;

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Mapped Colleges
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Colleges linked to this scholarship ({colleges.length} total).
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {visibleCount > INITIAL_COUNT ? (
            <button
              type="button"
              onClick={() => setVisibleCount(INITIAL_COUNT)}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
            >
              Show less
            </button>
          ) : null}
          {hasMore ? (
            <button
              type="button"
              onClick={() =>
                setVisibleCount((c) => Math.min(c + BATCH_SIZE, colleges.length))
              }
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
            >
              +{Math.min(BATCH_SIZE, remaining)} more
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50">
        {visible.map((college, idx) => (
          <CollegeCard key={college.id} college={college} idx={idx} />
        ))}
      </div>
    </article>
  );
}
