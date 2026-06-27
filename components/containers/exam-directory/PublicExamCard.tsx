"use client";

import type { Exam } from "@/api/exams";
import { ExamCardFields } from "@/components/dashboard/ExamCardFields";
import { ExamCardHeader } from "@/components/dashboard/ExamCardHeader";
import { directoryCardBgClass } from "./directoryCardTones";

export type PublicExamCardProps = {
  exam: Exam;
  name: string;
  /** Alternates playbook card colors: blue (#cfe0f1) and amber. */
  toneIndex?: number;
};

export function PublicExamCard({ exam, name, toneIndex = 0 }: PublicExamCardProps) {
  const bgClass = directoryCardBgClass(toneIndex);

  return (
    <article
      className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl shadow-sm ring-1 ring-black/[0.07] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${bgClass}`}
    >
      <ExamCardHeader exam={exam} name={name} borderClassName="border-b border-black/10" />

      <div className="flex min-w-0 flex-1 flex-col gap-2 overflow-hidden p-3 pt-2.5">
        <ExamCardFields exam={exam} linkFrom="exam-card" />
      </div>
    </article>
  );
}
