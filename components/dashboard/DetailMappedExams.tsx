"use client";

import { useState } from "react";
import Link from "next/link";
import type { DashboardLinkedExam } from "@/api/auth/profile";
import { examDetailHref } from "@/lib/examDisplay";

const PREVIEW_COUNT = 3;

// Linked-exam payloads carry no logo, so each card uses a deterministic gradient cover.
const COVER_GRADIENTS = [
  "from-[#341050] to-[#7c3aed]",
  "from-[#0f766e] to-[#22d3ee]",
  "from-[#b45309] to-[#f59e0b]",
  "from-[#9d174d] to-[#fb7185]",
];

function ExamCard({
  exam,
  linkFrom,
  idx,
}: {
  exam: DashboardLinkedExam;
  linkFrom: string;
  idx: number;
}) {
  const cover = exam.code?.trim() || exam.abbreviation?.trim() || exam.name;
  const gradient = COVER_GRADIENTS[idx % COVER_GRADIENTS.length];

  return (
    <Link
      href={examDetailHref(exam.id, linkFrom)}
      className="group flex w-56 shrink-0 flex-col overflow-hidden rounded-xl border border-slate-200 bg-[#F6F8FA] transition hover:border-[#FAD53C] hover:shadow-sm dark:border-slate-800 dark:bg-slate-950"
    >
      <div
        className={`relative flex aspect-[23/9] w-full items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <span className="line-clamp-2 px-3 text-center text-base font-bold uppercase tracking-wide text-white">
          {cover}
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-0.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          {exam.name}
        </h3>
        {exam.code?.trim() ? (
          <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">{exam.code}</p>
        ) : null}
      </div>
    </Link>
  );
}

type DetailMappedExamsProps = {
  linkedExams?: DashboardLinkedExam[];
  linkFrom: string;
  subtitle?: string;
};

export function DetailMappedExams({
  linkedExams = [],
  linkFrom,
  subtitle = "Exams mapped to this.",
}: DetailMappedExamsProps) {
  const [expanded, setExpanded] = useState(false);
  if (!linkedExams.length) return null;

  const hasMore = linkedExams.length > PREVIEW_COUNT;
  const visible = expanded ? linkedExams : linkedExams.slice(0, PREVIEW_COUNT);

  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            Mapped Exams
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {subtitle} ({linkedExams.length} total).
          </p>
        </div>
        {hasMore ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-500"
          >
            {expanded ? "Show less" : `+${linkedExams.length - PREVIEW_COUNT} more`}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 [scrollbar-width:thin] [scrollbar-color:#94a3b8_transparent] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-400/50">
        {visible.map((exam, idx) => (
          <ExamCard key={exam.id} exam={exam} linkFrom={linkFrom} idx={idx} />
        ))}
      </div>
    </article>
  );
}
