"use client";

import type { Exam } from "@/api/exams";
import { examCardLinkedCollegeNames } from "@/lib/examDisplay";

type ExamCardLinkedCollegesProps = {
  exam: Exam;
};

/** College names linked to this exam (max 3). */
export function ExamCardLinkedColleges({ exam }: ExamCardLinkedCollegesProps) {
  const names = examCardLinkedCollegeNames(exam);
  if (!names.length) return null;

  return (
    <div className="space-y-0.5">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Colleges you can get
      </p>
      <p className="line-clamp-2 text-[11px] leading-snug text-slate-700 dark:text-slate-300">
        {names.join(" · ")}
      </p>
    </div>
  );
}
