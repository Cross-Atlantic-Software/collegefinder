"use client";

import Image from "next/image";
import Link from "next/link";
import type { ExamLinkedCollege } from "@/api/exams";
import {
  collegeDetailHref,
  collegeLocationLine,
  collegeLogoSrc,
} from "@/lib/collegeDisplay";

const PREVIEW_COUNT = 3;

type ExamLinkedCollegesProps = {
  colleges: ExamLinkedCollege[];
  from: string;
  /** Dashboard section for "View more" — defaults to All Colleges tab. */
  viewMoreHref?: string;
};

export default function ExamLinkedColleges({
  colleges,
  from,
  viewMoreHref = "/dashboard?section=college-shortlist&tab=all",
}: ExamLinkedCollegesProps) {
  const preview = colleges.slice(0, PREVIEW_COUNT);
  const hasMoreThanPreview = colleges.length > PREVIEW_COUNT;

  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Colleges accepting this exam
        </h2>
        {hasMoreThanPreview ? (
          <Link
            href={viewMoreHref}
            className="text-xs font-semibold text-[#341050] underline-offset-2 hover:underline dark:text-violet-300"
          >
            View more
          </Link>
        ) : null}
      </div>

      {preview.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400 dark:text-slate-500">
          No colleges are linked to this exam yet.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {preview.map((college) => {
            const logo = collegeLogoSrc(college);
            const logoRemote = logo.startsWith("http");
            const location = collegeLocationLine(college);
            return (
              <li key={college.id}>
                <Link
                  href={collegeDetailHref(college, from)}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F6F8FA] p-3 transition hover:border-slate-200 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                >
                  <span className="relative flex h-12 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                    <Image
                      src={logo}
                      alt=""
                      width={64}
                      height={40}
                      className="max-h-full max-w-full object-contain"
                      unoptimized={logoRemote}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {college.college_name}
                    </span>
                    {location ? (
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {location}
                      </span>
                    ) : null}
                    {college.college_type ? (
                      <span className="mt-1 inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {college.college_type}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasMoreThanPreview && preview.length > 0 ? (
        <Link
          href={viewMoreHref}
          className="mt-4 inline-flex text-xs font-semibold text-[#341050] underline-offset-2 hover:underline dark:text-violet-300"
        >
          View all {colleges.length} colleges
        </Link>
      ) : null}
    </article>
  );
}
