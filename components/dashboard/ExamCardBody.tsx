"use client";

import Link from "next/link";
import type { Exam } from "@/api/exams";
import {
  examCardConductingAuthority,
  examCardDescription,
  examCardDuration,
  examCardMode,
  examCardStreamLine,
  examCardTypeLabel,
} from "@/lib/examDisplay";

type ExamCardBodyProps = {
  exam: Exam;
  detailHref: string;
  onPrefetchDetail?: () => void;
  /** Parent is already a link — do not nest another link on "...". */
  embedInLink?: boolean;
};

export function ExamCardBody({
  exam,
  detailHref,
  onPrefetchDetail,
  embedInLink = false,
}: ExamCardBodyProps) {
  const examType = examCardTypeLabel(exam);
  const description = examCardDescription(exam);
  const conductingAuthority = examCardConductingAuthority(exam);
  const mode = examCardMode(exam);
  const duration = examCardDuration(exam);
  const stream = examCardStreamLine(exam);

  const moreControl = embedInLink ? (
    <span className="ml-0.5 font-semibold text-slate-900 dark:text-slate-100">...</span>
  ) : (
    <Link
      href={detailHref}
      onMouseEnter={onPrefetchDetail}
      onFocus={onPrefetchDetail}
      className="ml-0.5 font-semibold text-slate-900 underline-offset-2 hover:underline dark:text-slate-100"
      aria-label={`Read more about ${exam.name}`}
    >
      ...
    </Link>
  );

  return (
    <div className="flex flex-col gap-2">
      {examType ? (
        <p className="text-[11px] text-slate-600 dark:text-slate-400">
          <span className="font-medium text-slate-800 dark:text-slate-200">Exam type: </span>
          {examType}
        </p>
      ) : null}

      {description ? (
        <p className="text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          <span className="line-clamp-2">{description}</span>
          {moreControl}
        </p>
      ) : null}

      {conductingAuthority || mode || duration || stream ? (
        <div className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
          {conductingAuthority ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                Conducting authority:{" "}
              </span>
              <span className="line-clamp-2">{conductingAuthority}</span>
            </p>
          ) : null}
          {mode ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Mode: </span>
              {mode}
            </p>
          ) : null}
          {duration ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Duration: </span>
              {duration}
            </p>
          ) : null}
          {stream ? (
            <p>
              <span className="font-medium text-slate-800 dark:text-slate-200">Stream: </span>
              <span className="line-clamp-2">{stream}</span>
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
