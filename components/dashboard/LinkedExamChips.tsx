"use client";

import Link from "next/link";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { examDetailHref, linkedExamChipLabel } from "@/lib/examDisplay";

export type LinkedExamChipExam = {
  id: number;
  name: string;
  code?: string | null;
  abbreviation?: string | null;
};

export type LinkedExamChipsFrom =
  | "dashboard-college-shortlist"
  | "dashboard-coaching-shortlist"
  | "dashboard-scholarship-shortlist";

/** Max linked exam chips on college, coaching, and scholarship shortlist cards. */
export const LINKED_EXAM_CHIPS_CARD_MAX = 3;

type LinkedExamChipsProps = {
  linkedExams?: LinkedExamChipExam[] | null;
  linkFrom: LinkedExamChipsFrom;
  /** Omit on detail pages to show every linked exam. */
  maxVisible?: number;
};

function examChipClassName(): string {
  return `${EXAM_CARD_CHIP_CLASS} cursor-pointer transition-colors hover:bg-slate-200 hover:text-slate-900 dark:hover:bg-slate-700 dark:hover:text-slate-100`;
}

/** Linked exam pills on college, coaching, and scholarship shortlist cards. */
export function LinkedExamChips({
  linkedExams,
  linkFrom,
  maxVisible,
}: LinkedExamChipsProps) {
  const exams = linkedExams ?? [];
  if (!exams.length) return null;

  const limit = maxVisible ?? exams.length;
  const visible = exams.slice(0, limit);
  const overflow = Math.max(0, exams.length - limit);

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((ex) => {
        const label = linkedExamChipLabel(ex);
        return (
          <Link
            key={ex.id}
            href={examDetailHref(ex.id, linkFrom)}
            className={examChipClassName()}
            title={ex.name}
            onClick={(e) => e.stopPropagation()}
          >
            {label}
          </Link>
        );
      })}
      {overflow > 0 ? (
        <span className={EXAM_CARD_CHIP_CLASS} title={`${overflow} more linked exams`}>
          +{overflow}
        </span>
      ) : null}
    </div>
  );
}
