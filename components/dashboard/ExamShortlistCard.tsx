"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { Exam } from "@/api/exams";
import { Button } from "@/components/shared";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import { ExamCardAttemptNegativeRow } from "@/components/dashboard/ExamCardAttemptNegativeRow";
import { ExamCardLinkedColleges } from "@/components/dashboard/ExamCardLinkedColleges";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import {
  examCardAttemptLimit,
  examCardConductingAuthority,
  examCardNegativeMarking,
  examCardOverview,
  examCardTagChips,
  examCardTypeLabel,
} from "@/lib/examDisplay";

export type ExamShortlistCardProps = {
  exam: Exam;
  name: string;
  detailHref: string;
  tabSource: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
  onApply: () => void;
  onPrefetchDetail?: () => void;
};

export function ExamShortlistCard({
  exam,
  name,
  detailHref,
  tabSource: _tabSource,
  isShortlisted,
  shortlistSaving,
  onShortlist,
  onApply,
  onPrefetchDetail,
}: ExamShortlistCardProps) {
  const examType = examCardTypeLabel(exam);
  const conductingAuthority = examCardConductingAuthority(exam);
  const overview = examCardOverview(exam);
  const chips = examCardTagChips(exam);
  const attemptLimit = examCardAttemptLimit(exam);
  const negativeMarking = examCardNegativeMarking(exam);

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
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

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {overview}
        </p>

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

        <ExamCardLinkedColleges exam={exam} variant="chips" linkFrom="exam-shortlist" />

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="themeButtonOutline"
              size="sm"
              href={detailHref}
              onMouseEnter={onPrefetchDetail}
              onFocus={onPrefetchDetail}
              className="w-full justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View
            </Button>
            <Button
              variant="themeButton"
              size="sm"
              type="button"
              onClick={onApply}
              className="w-full justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
            >
              Apply
            </Button>
          </div>
          <button
            type="button"
            onClick={onShortlist}
            disabled={shortlistSaving}
            aria-pressed={isShortlisted}
            className={`mt-2 flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              isShortlisted
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "border border-slate-200 bg-white text-slate-800 shadow-sm hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {shortlistSaving ? (
              "Saving..."
            ) : isShortlisted ? (
              <>
                <FaHeart className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                Shortlisted
              </>
            ) : (
              <>
                <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Shortlist exam
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
