"use client";

import { useState } from "react";
import { LuCircleCheck, LuPencil, LuChevronDown, LuFileText } from "react-icons/lu";
import {
  useSubmissionsQuery,
  useSubmissionDetailQuery,
} from "@/lib/submissionsQueries";
import type {
  FillReportSummary,
  FillReportDetail,
  FillStatus,
} from "@/api/submissions";

/* ── small presentational helpers ─────────────────────────────────────── */

function humanizeExam(examId: string) {
  return examId
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizePath(path: string) {
  // "education.class_12.board" -> "Class 12 Board"
  const last = path.split(".").slice(-2).join(" ");
  return last.replace(/[_.]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<FillStatus, string> = {
  filled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  check: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-700 ring-rose-200",
  not_found: "bg-rose-50 text-rose-700 ring-rose-200",
  skipped: "bg-slate-100 text-slate-500 ring-slate-200",
};

function StatusPill({ status }: { status: FillStatus }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

/* ── detail (loaded on expand) ────────────────────────────────────────── */

function SubmissionDetail({ id }: { id: number }) {
  const { data, isLoading, isError, error } = useSubmissionDetailQuery(id);

  if (isLoading) {
    return <p className="px-4 py-3 text-sm text-slate-500">Loading details…</p>;
  }
  if (isError || !data) {
    return (
      <p className="px-4 py-3 text-sm text-rose-600">
        {(error as Error)?.message || "Couldn't load this submission. Try again."}
      </p>
    );
  }

  const detail = data as FillReportDetail;
  const changes = detail.student_changes
    ? Object.entries(detail.student_changes)
    : [];

  return (
    <div className="space-y-5 border-t border-slate-200 bg-[#f8fbff] px-4 py-4 md:px-5">
      {/* Information submitted */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Information submitted
        </p>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {detail.field_results.map((f, i) => (
            <div
              key={f.field_id + i}
              className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">
                  {f.label}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {f.value && f.value.length ? f.value : "—"}
                </p>
              </div>
              <StatusPill status={f.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Changes the student made */}
      {changes.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Changes you made
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {changes.map(([path, c]) => (
              <div
                key={path}
                className="border-b border-slate-100 px-3 py-2 last:border-b-0"
              >
                <p className="text-sm font-medium text-slate-800">
                  {humanizePath(path)}
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  <span className="text-rose-500 line-through">
                    {c.from || "(empty)"}
                  </span>
                  <span className="mx-1.5 text-slate-400">→</span>
                  <span className="text-emerald-600">{c.to || "(empty)"}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirmation */}
      <p className="text-xs text-slate-500">
        {detail.confirmed_at ? (
          <>
            Reviewed and confirmed on{" "}
            <span className="font-medium text-slate-700">
              {formatDateTime(detail.confirmed_at)}
            </span>
            .
          </>
        ) : (
          <>Filled without student review.</>
        )}
      </p>
    </div>
  );
}

/* ── one row in the list ──────────────────────────────────────────────── */

function SubmissionRow({
  report,
  expanded,
  onToggle,
}: {
  report: FillReportSummary;
  expanded: boolean;
  onToggle: () => void;
}) {
  const failed = report.failed_count;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold text-slate-900">
              {humanizeExam(report.exam_id)}
            </span>
            <span className="text-slate-300">·</span>
            <span className="truncate text-sm text-slate-600">
              {report.section_name}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDateTime(report.created_at)} · {report.filled_count}/
            {report.total_fields} filled
            {failed > 0 ? ` · ${failed} need attention` : ""}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {report.confirmed_at && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-[#FAD53C]">
              <LuCircleCheck className="text-xs" />
              Confirmed
            </span>
          )}
          {report.has_changes && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
              <LuPencil className="text-[10px]" />
              Edited
            </span>
          )}
          <LuChevronDown
            className={`text-slate-400 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {expanded && <SubmissionDetail id={report.id} />}
    </div>
  );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function SubmissionsTab() {
  const { data, isLoading, isError, error } = useSubmissionsQuery();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div>
      <div className="mb-4">
        <p className="text-lg font-semibold text-slate-900">Submissions</p>
        <p className="mt-0.5 text-xs text-slate-500">
          A record of every form you&apos;ve filled — what was submitted, what you
          changed, and when you confirmed it.
        </p>
      </div>

      {isLoading && (
        <p className="py-10 text-center text-sm text-slate-500">
          Loading your submissions…
        </p>
      )}

      {isError && (
        <p className="py-10 text-center text-sm text-rose-600">
          {(error as Error)?.message ||
            "Couldn't load your submissions. Refresh to try again."}
        </p>
      )}

      {!isLoading && !isError && data && data.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <LuFileText className="text-2xl text-slate-300" />
          <p className="text-sm font-medium text-slate-700">No submissions yet</p>
          <p className="max-w-xs text-xs text-slate-500">
            Once you fill a form with the ExamFill assistant, each submission
            shows up here for your records.
          </p>
        </div>
      )}

      {!isLoading && !isError && data && data.length > 0 && (
        <div className="space-y-3">
          {data.map((report) => (
            <SubmissionRow
              key={report.id}
              report={report}
              expanded={expandedId === report.id}
              onToggle={() =>
                setExpandedId((cur) => (cur === report.id ? null : report.id))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
