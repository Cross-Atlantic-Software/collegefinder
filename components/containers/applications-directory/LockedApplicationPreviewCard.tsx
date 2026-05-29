"use client";

import Link from "next/link";
import { FiLock } from "react-icons/fi";
import type { PublicApplication } from "@/api/applications";
import { PublicApplicationCard } from "./PublicApplicationCard";

export type LockedApplicationPreviewCardProps = {
  application: PublicApplication | null;
  loginHref?: string;
};

export function LockedApplicationPreviewCard({
  application,
  loginHref = "/login?redirect=/dashboard?section=applications",
}: LockedApplicationPreviewCardProps) {
  return (
    <div className="relative min-h-[220px] overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
      <div className="pointer-events-none select-none blur-[3px]">
        {application ? (
          <PublicApplicationCard application={application} />
        ) : (
          <div className="min-h-[220px] rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="h-4 w-3/4 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-1/2 rounded bg-slate-100" />
            <div className="mt-6 h-16 rounded-lg bg-slate-50" />
          </div>
        )}
      </div>

      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/55 px-4 backdrop-blur-[1px]">
        <div className="rounded-full bg-white p-4 shadow-md ring-1 ring-black/10">
          <FiLock className="h-7 w-7 text-slate-600" aria-hidden />
        </div>
        <p className="mt-4 text-center text-sm font-semibold text-slate-800">Log in to view more</p>
        <p className="mt-1 max-w-[240px] text-center text-xs text-slate-600">
          Sign in to create applications and run one-click form filling.
        </p>
        <Link
          href={loginHref}
          className="landing-cta mt-5 inline-flex items-center justify-center rounded-full border border-black/30 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
