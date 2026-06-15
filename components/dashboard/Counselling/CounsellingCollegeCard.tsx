"use client";

import { FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import type { CounsellingCollegeResult } from "./dummyData";

const PROBABILITY_STYLES: Record<
  CounsellingCollegeResult["probability"],
  { badge: string; label: string; donutColor: string; percent: number }
> = {
  High: {
    badge:      "border-transparent bg-[#FAD53C] text-black shadow-sm",
    label:      "High chance",
    donutColor: "stroke-[#FAD53C]",
    percent:    85,
  },
  Moderate: {
    badge:      "border-transparent bg-black/80 text-[#FAD53C] shadow-sm backdrop-blur-md dark:bg-white/90 dark:text-black",
    label:      "Moderate chance",
    donutColor: "stroke-black dark:stroke-white",
    percent:    52,
  },
  Reach: {
    badge:      "border-transparent bg-white/90 text-slate-800 shadow-sm backdrop-blur-md dark:bg-black/60 dark:text-slate-300",
    label:      "Reach option",
    donutColor: "stroke-slate-300 dark:stroke-slate-600",
    percent:    22,
  },
};

function DonutChart({ percentage, colorClass, delayMs }: { percentage: number; colorClass: string; delayMs: number }) {
  const radius = 29;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-900">
      <svg className="absolute h-16 w-16 -rotate-90 transform" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={radius} className="fill-none stroke-slate-100 dark:stroke-slate-800" strokeWidth="6" />
        <circle
          cx="32"
          cy="32"
          r={radius}
          className={`fill-none ${colorClass}`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: `stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1) ${delayMs}ms` }}
        />
      </svg>
      <div className="z-10 mt-0.5 flex flex-col items-center leading-none">
        <span className="text-[11px] font-black text-slate-900 dark:text-slate-100">{percentage}%</span>
        <span className="mt-[1px] text-[6px] font-bold uppercase tracking-widest text-slate-400">Chance</span>
      </div>
    </div>
  );
}

type Props = {
  college:  CounsellingCollegeResult;
  userRank: number;
  index?:   number;
};

export default function CounsellingCollegeCard({ college, userRank, index = 0 }: Props) {
  const s = PROBABILITY_STYLES[college.probability];

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900"
      style={{ animation: `fade-in ${160 + index * 50}ms ease-out both` }}
    >
      {/* cover image header */}
      <div className="relative h-32 w-full bg-slate-100 dark:bg-slate-800">
        <img
          src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=400"
          alt="College campus"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {/* gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* probability badge overlay */}
        <div className="absolute right-2 top-2">
          <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[9px] font-bold tracking-wide uppercase ${s.badge}`}>
            {s.label}
          </span>
        </div>

        {/* title overlay */}
        <div className="absolute bottom-3 left-3 pr-[60px] text-white">
          <h3 className="truncate text-[15px] font-bold leading-tight">
            {college.name}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-white/80">
            <FaMapMarkerAlt className="h-3 w-3 shrink-0" />
            <span className="truncate">{college.location}</span>
          </p>
        </div>

        {/* overlapping donut chart */}
        <div className="absolute -bottom-8 right-4 z-10">
          <DonutChart percentage={s.percent} colorClass={s.donutColor} delayMs={index * 80} />
        </div>
      </div>

      {/* body */}
      <div className="flex flex-1 flex-col gap-3 p-4 pt-6">
        <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-slate-400">
          <span>Admission chance</span>
        </div>

        {/* stats grid */}
        <div className="mt-1 grid grid-cols-2 gap-2 text-[11px]">
          {[
            { label: "Branch",       value: college.branch        },
            { label: "Type",         value: college.collegeType   },
            { label: "Closing rank", value: college.closingRank.toLocaleString("en-IN") },
            { label: "Your rank",    value: userRank.toLocaleString("en-IN")            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2 dark:border-slate-800 dark:bg-slate-800/50">
              <p className="text-[10px] text-slate-500 dark:text-slate-400">{label}</p>
              <p className="mt-0.5 truncate font-medium text-slate-900 dark:text-slate-100">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}
