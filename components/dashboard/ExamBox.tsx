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
    if (matchPercent >= 90) return "bg-emerald-100 text-emerald-700";
    if (matchPercent >= 70) return "bg-blue-100 text-blue-700";
    return "bg-slate-100 text-slate-700";
  }, [matchPercent]);

  return (
    <div className="relative w-full max-w-4xl overflow-hidden rounded-md bg-white/5 p-5 mb-5">
      {/* Top row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-5 relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-pink-50 text-3xl text-pink-500 shadow-sm dark:bg-pink-500/10">
          <MdSchool />
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-xl font-semibold text-slate-100 dark:text-slate-50">
              {title}
            </h3>

            {isHot && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-0.5 text-xs font-medium text-orange-700 dark:bg-orange-500/15 dark:text-orange-300">
                🔥 Hot
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-slate-200 dark:text-slate-300">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${matchColor}`}
            >
              {matchPercent}% Match
            </span>

            {isRecommended && (
              <span className="inline-flex items-center gap-1 rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-700 dark:bg-pink-500/20 dark:text-pink-200">
                ⭐ Recommended
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full bg-pink-50 text-pink-500 shadow-sm transition hover:bg-pink-100 absolute right-0"
          aria-label="Add to favourites"
        >
          <MdFavoriteBorder className="h-5 w-5" />
        </button>
      </div>

      {/* Description */}
      <p className="mt-4 text-sm leading-relaxed text-slate-200">
        {description}
      </p>

      {/* Stat boxes */}
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-md bg-pink-50 p-3 text-sm dark:bg-pink-500/10">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <MdCalendarToday className="h-6 w-6 text-pink" />
            Date
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
            {dateLabel}
          </p>
        </div>

        <div className="rounded-md bg-emerald-50 p-3 text-sm dark:bg-emerald-500/10">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <MdCurrencyRupee className="h-6 w-6 text-emerald-600" />
            Fee
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
            {feeLabel}
          </p>
        </div>

        <div className="rounded-md bg-amber-50 p-3 text-sm dark:bg-amber-500/10">
          <p className="flex items-center gap-2 text-xs font-medium text-slate-600">
            <MdSchool className="h-6 w-6 text-orange-600" />
            Colleges
          </p>
          <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-50">
            {collegesCount}
          </p>
        </div>
      </div>

      {/* Meta + CTAs */}
      <div className="mt-6 flex-col gap-4 border-top border-t border-slate-600 pt-4 text-sm dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        {/* FIXED: details are now stacked label-over-value so they never overlap */}
        <dl className="grid flex-1 grid-cols-2 gap-3 text-xs sm:text-sm">
          <div>
            <dt className="text-slate-200">Difficulty</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {difficulty}
            </dd>
          </div>

          <div>
            <dt className="text-slate-200">Applicants</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {applicants}
            </dd>
          </div>

          <div>
            <dt className="text-slate-200">Mode</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {mode}
            </dd>
          </div>

          <div>
            <dt className="text-slate-200">Eligible</dt>
            <dd className="mt-0.5 font-medium text-slate-100">
              {eligibility}
            </dd>
          </div>
        </dl>

        {/* Buttons */}
        <div className="flex mt-3 flex-col gap-3 sm:flex-row sm:items-center">
            
            <Button variant="DarkGradient" size="sm" className="w-full gap-2" onClick={onToggleShortlist} > {shortlisted ? ( <> <FaCheckCircle className="h-5 w-5" /> Shortlisted </> ) : ( <> <FaRegCheckCircle className="h-5 w-5" /> Shortlist </> )} </Button>
            <Button variant="DarkGradient" size="sm" className="w-full gap-2" onClick={onApply} > <PiCursorClickFill className="h-5 w-5" /> Apply Now </Button>
            <div className="relative flex items-center group">
                <Button variant="themeButtonOutline" size="sm" className="!px-2 !py-2" > <MdInfoOutline className="h-6 w-6" onClick={onInfo} /> </Button>
                {/* Tooltip */}
                <div className="pointer-events-none absolute bottom-full right-0 z-20 mb-2 w-max scale-0 rounded-md bg-pink px-3 py-1.5 text-xs text-white opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100 sm:group-hover:scale-100 sm:group-hover:opacity-100 group">This exam requires 12th PCM with 75%</div>
            </div>
            
        </div>
      </div>
    </div>
  );
}
