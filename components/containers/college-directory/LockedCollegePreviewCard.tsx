"use client";

import Link from "next/link";
import { FiLock } from "react-icons/fi";
import type { DashboardCollege } from "@/api/auth/profile";
import { directoryCardBgClass } from "@/components/containers/exam-directory/directoryCardTones";
import { PublicCollegeCard } from "./PublicCollegeCard";

export type LockedCollegePreviewCardProps = {
  college: DashboardCollege | null;
  loginHref?: string;
  toneIndex?: number;
};

export function LockedCollegePreviewCard({
  college,
  loginHref = "/login?redirect=/college-directory",
  toneIndex = 0,
}: LockedCollegePreviewCardProps) {
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <div className="relative h-full min-h-[280px] overflow-hidden rounded-2xl ring-1 ring-black/[0.07]">
      <div className="pointer-events-none h-full select-none blur-[3px]">
        {college ? (
          <PublicCollegeCard college={college} toneIndex={toneIndex} />
        ) : (
          <div className={`flex h-full min-h-[280px] flex-col rounded-2xl p-6 shadow-sm ${bgClass}`}>
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-6 flex-1 rounded-lg bg-slate-50" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/55 px-4 backdrop-blur-[1px]">
        <div className="rounded-full bg-white p-4 shadow-md ring-1 ring-black/10">
          <FiLock className="h-7 w-7 text-slate-600" aria-hidden />
        </div>
        <p className="mt-4 max-w-[240px] text-center text-sm font-semibold text-slate-800">
          Make better college decisions with clarity.
        </p>
        <Link
          href={loginHref}
          className="landing-cta mt-5 inline-flex items-center justify-center rounded-full border border-black/30 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Explore Colleges
        </Link>
      </div>
    </div>
  );
}
