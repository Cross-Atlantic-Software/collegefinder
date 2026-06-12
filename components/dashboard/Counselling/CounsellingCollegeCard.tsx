"use client";

import { FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import type { CounsellingCollegeResult } from "./dummyData";

const PROBABILITY_STYLES: Record<
  CounsellingCollegeResult["probability"],
  { badge: string; label: string }
> = {
  High: {
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300",
    label: "High chance",
  },
  Moderate: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
    label: "Moderate chance",
  },
  Reach: {
    badge:
      "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-900/40 dark:bg-sky-950/30 dark:text-sky-300",
    label: "Reach option",
  },
};

type CounsellingCollegeCardProps = {
  college: CounsellingCollegeResult;
  userRank: number;
};

export default function CounsellingCollegeCard({
  college,
  userRank,
}: CounsellingCollegeCardProps) {
  const style = PROBABILITY_STYLES[college.probability];

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-[#f8fbff] text-[#b88900] dark:border-slate-700 dark:bg-slate-800">
              <FaUniversity className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {college.name}
              </h3>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                <FaMapMarkerAlt className="h-3 w-3 shrink-0" />
                <span className="truncate">{college.location}</span>
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
          >
            {style.label}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">Branch</p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {college.branch}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">Type</p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {college.collegeType}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">Closing rank</p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {college.closingRank.toLocaleString("en-IN")}
            </p>
          </div>
          <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
            <p className="text-slate-500 dark:text-slate-400">Your rank</p>
            <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
              {userRank.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        <p className="mt-auto text-[11px] leading-snug text-slate-500 dark:text-slate-400">
          Based on historical closing ranks for this exam. Final allotment depends on
          counselling rounds and seat availability.
        </p>
      </div>
    </article>
  );
}
