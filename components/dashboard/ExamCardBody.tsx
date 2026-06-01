"use client";

import Link from "next/link";
import type { Exam } from "@/api/exams";
import { ExamCardAttemptNegativeRow } from "@/components/dashboard/ExamCardAttemptNegativeRow";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { ExamCardLinkedColleges } from "@/components/dashboard/ExamCardLinkedColleges";
import { ExamCardMetaChips } from "@/components/dashboard/ExamCardMetaChips";
import {
  examCardAttemptLimit,
  examCardApplicationStartMonth,
  examCardConductingAuthority,
  examCardDescription,
  examCardDifficultyLevel,
  examCardDuration,
  examCardLinkedCollegeNames,
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
  const attemptLimit = examCardAttemptLimit(exam);
  const negativeMarking = examCardNegativeMarking(exam);
  const linkedCollegeNames = examCardLinkedCollegeNames(exam);
  const hasMetaChips = Boolean(
    examCardMode(exam) ||
      examCardDuration(exam) ||
      examCardApplicationStartMonth(exam) ||
      examCardDifficultyLevel(exam)
  );

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

      {conductingAuthority ||
      hasMetaChips ||
      attemptLimit ||
      negativeMarking ||
      linkedCollegeNames.length ? (
        <div className="m-0 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
          {conductingAuthority ? (
            <p className="m-0">
              <ExamCardHoverField label="Conducting Authority" value={conductingAuthority} />
            </p>
          ) : null}
          <ExamCardMetaChips exam={exam} />
          <ExamCardAttemptNegativeRow
            attemptLimit={attemptLimit}
            negativeMarking={negativeMarking}
          />
          <ExamCardLinkedColleges exam={exam} embedInLink={embedInLink} />
        </div>
      ) : null}
    </div>
  );
}
