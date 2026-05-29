"use client";

import type { Exam } from "@/api/exams";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardAttemptNegativeRow } from "@/components/dashboard/ExamCardAttemptNegativeRow";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import {
  examCardAttemptLimit,
  examCardConductingAuthority,
  examCardNegativeMarking,
  examCardOverview,
  examCardTagChips,
  examCardTypeLabel,
  examCardLinkedCollegeNames,
} from "@/lib/examDisplay";
import { directoryCardBgClass } from "./directoryCardTones";

export type PublicExamCardProps = {
  exam: Exam;
  name: string;
  /** Alternates playbook card colors: blue (#cfe0f1) and amber. */
  toneIndex?: number;
};

export function PublicExamCard({ exam, name, toneIndex = 0 }: PublicExamCardProps) {
  const examType = examCardTypeLabel(exam);
  const conductingAuthority = examCardConductingAuthority(exam);
  const overview = examCardOverview(exam);
  const chips = examCardTagChips(exam);
  const attemptLimit = examCardAttemptLimit(exam);
  const negativeMarking = examCardNegativeMarking(exam);
  const collegeNames = examCardLinkedCollegeNames(exam);
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
    >
      <div className="flex gap-3 border-b border-black/10 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900">
            {name}
          </h3>
          {conductingAuthority ? (
            <p>
              <ExamCardHoverField label="Conducting authority" value={conductingAuthority} />
            </p>
          ) : null}
          {examType ? (
            <p>
              <ExamCardHoverField label="Exam type" value={examType} />
            </p>
          ) : null}
        </div>
        <ExamLogo exam={exam} className="h-16 w-16 shrink-0 p-1.5" />
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600">{overview}</p>

        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <span key={chip} className={EXAM_CARD_CHIP_CLASS} title={chip}>
                {chip}
              </span>
            ))}
          </div>
        ) : null}

        <ExamCardAttemptNegativeRow
          attemptLimit={attemptLimit}
          negativeMarking={negativeMarking}
        />

        {collegeNames.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {collegeNames.map((college) => (
              <span key={college} className={EXAM_CARD_CHIP_CLASS} title={college}>
                {college}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
