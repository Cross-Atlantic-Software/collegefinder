"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { FiLock } from "react-icons/fi";
import { DIRECTORY_CARD_MIN_HEIGHT_CLASS } from "@/components/containers/exam-directory/directoryCardTones";

export type LockedDirectoryPreviewCardProps = {
  preview: ReactNode | null;
  fallbackBgClass: string;
  loginHref: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
};

/** Shared locked preview card shell for public directory grids. */
export function LockedDirectoryPreviewCard({
  preview,
  fallbackBgClass,
  loginHref,
  title,
  subtitle,
  ctaLabel,
}: LockedDirectoryPreviewCardProps) {
  return (
    <div
      className={`relative flex h-full ${DIRECTORY_CARD_MIN_HEIGHT_CLASS} min-h-0 flex-col overflow-hidden rounded-2xl ring-1 ring-black/[0.07]`}
    >
      <div
        className={`pointer-events-none h-full ${DIRECTORY_CARD_MIN_HEIGHT_CLASS} min-h-0 flex-1 select-none blur-[3px]`}
      >
        {preview ? (
          <div className="h-full min-h-full">{preview}</div>
        ) : (
          <div className={`flex h-full flex-col rounded-2xl p-6 shadow-sm ${fallbackBgClass}`}>
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
        <p className="mt-4 text-center text-sm font-semibold text-slate-800">{title}</p>
        <p className="mt-1 max-w-[240px] text-center text-xs text-slate-600">{subtitle}</p>
        <Link
          href={loginHref}
          className="landing-cta mt-5 inline-flex items-center justify-center rounded-full border border-black/30 bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-black hover:text-white"
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
