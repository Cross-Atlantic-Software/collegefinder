// src/components/exams/ExamBox.tsx
"use client";

import React, { useMemo } from "react";
import {
  MdFavoriteBorder,
  MdInfoOutline,
  MdCalendarToday,
  MdCurrencyRupee,
  MdSchool,
} from "react-icons/md";
import { Button } from "../shared";
import { PiCursorClickFill } from "react-icons/pi";
import { FaCheckCircle, FaRegCheckCircle } from "react-icons/fa";

type ExamBoxProps = {
  title: string;
  subtitle: string;
  description: string;

  isHot?: boolean;
  matchPercent?: number;
  isRecommended?: boolean;

  dateLabel: string;
  feeLabel: string;
  collegesCount: number | string;

  difficulty: string;
  applicants: string;
  mode: string;
  eligibility: string;

  shortlisted?: boolean;
  onToggleShortlist?: () => void;
  onApply?: () => void;
  onInfo?: () => void;
};

export default function ExamBox({
    
  title,
  subtitle,
  description,
  isHot = false,
  matchPercent = 0,
  isRecommended = false,
  dateLabel,
  feeLabel,
  collegesCount,
  difficulty,
  applicants,
  mode,
  eligibility,
  shortlisted = false,
  onToggleShortlist,
  onApply,
  onInfo,
}: ExamBoxProps) {
  const matchColor = useMemo(() => {
    if (matchPercent >= 90) return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400";
    if (matchPercent >= 70) return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
    return "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300";
  }, [matchPercent]);

  return (
    <div className="relative w-full overflow-hidden card-base card-hover p-6 mb-6 transition-all duration-300 animate-fade-in">
      {/* Top row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-action-100 dark:bg-slate-700 text-3xl text-action-700 dark:text-action-500 shadow-sm flex-shrink-0">
          <MdSchool />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {title}
            </h3>

            {isHot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 dark:bg-orange-900/30 px-2.5 py-0.5 text-xs font-semibold text-orange-700 dark:text-orange-400">
                🔥 Hot
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${matchColor}`}
            >
              {matchPercent}% Match
            </span>

            {isRecommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-highlight-100 dark:bg-slate-700 px-3 py-1 text-xs font-semibold text-brand-ink dark:text-slate-100">
                ⭐ Recommended
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="ml-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-action-700 dark:text-action-500 transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-600 absolute right-0"
          aria-label="Add to favourites"
        >
          <MdFavoriteBorder className="h-5 w-5" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        {description}
      </p>

      {/* Stat boxes */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30 p-4 text-sm transition-all duration-200">
          <p className="metric-label flex items-center gap-2 text-blue-700 dark:text-blue-400">
            <MdCalendarToday className="h-6 w-6 text-action-600" />
            Date
          </p>
          <p className="mt-1.5 text-base font-bold text-blue-900 dark:text-blue-100" style={{ fontVariantNumeric: "tabular-nums" }}>
            {dateLabel}
          </p>
        </div>

        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 p-4 text-sm transition-all duration-200">
          <p className="metric-label flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <MdCurrencyRupee className="h-6 w-6 text-emerald-600" />
            Fee
          </p>
          <p className="mt-1.5 text-base font-bold text-emerald-900 dark:text-emerald-100" style={{ fontVariantNumeric: "tabular-nums" }}>
            {feeLabel}
          </p>
        </div>

        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-4 text-sm transition-all duration-200">
          <p className="metric-label flex items-center gap-2 text-amber-700 dark:text-amber-400">
            <MdSchool className="h-6 w-6 text-orange-600" />
            Colleges
          </p>
          <p className="mt-1.5 text-base font-bold text-amber-900 dark:text-amber-100" style={{ fontVariantNumeric: "tabular-nums" }}>
            {collegesCount}
          </p>
        </div>
      </div>

      {/* Meta + CTAs */}
      <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 dark:border-slate-700 pt-5 text-sm sm:flex-row sm:items-end sm:justify-between">
        {/* FIXED: details are now stacked label-over-value so they never overlap */}
        <dl className="grid flex-1 grid-cols-2 gap-x-4 gap-y-3 text-xs sm:text-sm">
          <div>
            <dt className="metric-label">Difficulty</dt>
            <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
              {difficulty}
            </dd>
          </div>

          <div>
            <dt className="metric-label">Applicants</dt>
            <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
              {applicants}
            </dd>
          </div>

          <div>
            <dt className="metric-label">Mode</dt>
            <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
              {mode}
            </dd>
          </div>

          <div>
            <dt className="metric-label">Eligible</dt>
            <dd className="mt-0.5 font-bold text-slate-900 dark:text-slate-100">
              {eligibility}
            </dd>
          </div>
        </dl>

        {/* Buttons */}
        <div className="flex mt-3 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            
            <Button variant="secondary" size="sm" className="gap-2" onClick={onToggleShortlist} > {shortlisted ? ( <> <FaCheckCircle className="h-4 w-4" /> Shortlisted </> ) : ( <> <FaRegCheckCircle className="h-4 w-4" /> Shortlist </> )} </Button>
            <Button variant="primary" size="sm" className="gap-2" onClick={onApply} > <PiCursorClickFill className="h-4 w-4" /> Apply Now </Button>
            <div className="relative flex items-center group">
              <Button variant="ghost" size="sm" className="!px-2 !py-1.5" > <MdInfoOutline className="h-5 w-5" onClick={onInfo} /> </Button>
              {/* Tooltip */}
              <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-max scale-0 rounded-lg bg-slate-900 dark:bg-slate-100 px-3 py-1.5 text-xs text-white dark:text-slate-900 opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100 whitespace-nowrap">This exam requires 12th PCM with 75%</div>
            </div>
            
        </div>
      </div>
    </div>
  );
}
