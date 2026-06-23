"use client";

import type { Exam } from "@/api/exams";
import { ExamCardAttemptNegativeRow } from "@/components/dashboard/ExamCardAttemptNegativeRow";
import { ExamCardLinkedColleges } from "@/components/dashboard/ExamCardLinkedColleges";
import { ExamCardMetaChips } from "@/components/dashboard/ExamCardMetaChips";
import {
  examCardAttemptLimit,
  examCardNegativeMarking,
  examCardOverview,
} from "@/lib/examDisplay";

type ExamCardFieldsProps = {
  exam: Exam;
  /** Extra room on the right (e.g. shortlist heart). */
  overviewClassName?: string;
  linkFrom?: "exam-card" | "exam-shortlist";
};

/** Shared exam card body fields: overview, chips, attempts, linked colleges. */
export function ExamCardFields({
  exam,
  overviewClassName = "",
  linkFrom = "exam-shortlist",
}: ExamCardFieldsProps) {
  const overview = examCardOverview(exam);
  const attemptLimit = examCardAttemptLimit(exam);
  const negativeMarking = examCardNegativeMarking(exam);

  return (
    <>
      <p
        className={`line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400 ${overviewClassName}`}
      >
        {overview}
      </p>

      <ExamCardMetaChips exam={exam} />

      <div className="min-w-0 w-full overflow-hidden">
        <ExamCardAttemptNegativeRow
          attemptLimit={attemptLimit}
          negativeMarking={negativeMarking}
        />
      </div>

      <ExamCardLinkedColleges exam={exam} variant="chips" linkFrom={linkFrom} />
    </>
  );
}
