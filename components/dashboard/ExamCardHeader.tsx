"use client";

import type { Exam } from "@/api/exams";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import { examCardConductingAuthority, examCardTypeLabel } from "@/lib/examDisplay";

type ExamCardHeaderProps = {
  exam: Exam;
  name: string;
  borderClassName?: string;
};

export function ExamCardHeader({
  exam,
  name,
  borderClassName = "border-slate-100 dark:border-slate-800",
}: ExamCardHeaderProps) {
  const examType = examCardTypeLabel(exam);
  const conductingAuthority = examCardConductingAuthority(exam);

  return (
    <div
      className={`flex items-start gap-2.5 border-b px-3 pt-2 pb-1.5 ${borderClassName}`}
    >
      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-2 text-xs font-semibold leading-tight text-slate-900 dark:text-slate-100">
          {name}
        </h3>
        {conductingAuthority || examType ? (
          <div className="mt-1.5 flex flex-col gap-2">
            {conductingAuthority ? (
              <ExamCardHoverField
                compact
                label="Conducting Authority"
                value={conductingAuthority}
              />
            ) : null}
            {examType ? (
              <ExamCardHoverField compact label="Exam Type" value={examType} />
            ) : null}
          </div>
        ) : null}
      </div>
      <ExamLogo exam={exam} className="h-[60px] w-[60px] shrink-0 rounded-xl" />
    </div>
  );
}
