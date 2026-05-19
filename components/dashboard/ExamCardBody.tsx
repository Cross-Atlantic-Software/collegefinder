"use client";

import Link from "next/link";
import type { Exam } from "@/api/exams";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { ExamCardAttemptNegativeRow } from "@/components/dashboard/ExamCardAttemptNegativeRow";
import { ExamCardLinkedColleges } from "@/components/dashboard/ExamCardLinkedColleges";
import {
  examCardAttemptLimit,
  examCardConductingAuthority,
  examCardDescription,
  examCardDuration,
  examCardMode,
  examCardNegativeMarking,
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
  const attemptLimit = examCardAttemptLimit(exam);
  const negativeMarking = examCardNegativeMarking(exam);

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
    <div
      className={`flex flex-col ${embedInLink ? "gap-1 -mt-0.5" : "gap-2"}`}
    >
      {examType ? (
        <p className="m-0 leading-snug">
          <ExamCardHoverField label="Exam type" value={examType} />
        </p>
      ) : null}

      {description ? (
        <p className="m-0 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          <span className="line-clamp-2">{description}</span>
          {moreControl}
        </p>
      ) : null}

      {conductingAuthority || mode || duration || attemptLimit || negativeMarking ? (
        <div className="m-0 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
          {conductingAuthority ? (
            <p className="m-0">
              <ExamCardHoverField label="Conducting authority" value={conductingAuthority} />
            </p>
          ) : null}
          {mode ? (
            <p className="m-0">
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
          <ExamCardAttemptNegativeRow
            attemptLimit={attemptLimit}
            negativeMarking={negativeMarking}
          />
          <ExamCardLinkedColleges exam={exam} />
        </div>
      ) : null}
    </div>
  );
}
