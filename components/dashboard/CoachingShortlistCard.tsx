"use client";

import { FaHeart, FaRegHeart } from "react-icons/fa";
import type { DashboardInstitute } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
import { InstituteLogo } from "@/components/dashboard/InstituteLogo";
import { instituteLocationLine } from "@/lib/instituteDisplay";

export type CoachingShortlistCardProps = {
  institute: DashboardInstitute;
  detailHref: string;
  displayOverview: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
};

function formatDeliveryType(type: string | null | undefined): string {
  const t = type?.trim().toLowerCase();
  if (t === "online") return "Online";
  if (t === "offline") return "Offline";
  if (t === "hybrid") return "Hybrid";
  return type?.trim() || "";
}

export function CoachingShortlistCard({
  institute,
  detailHref,
  displayOverview,
  isShortlisted,
  shortlistSaving,
  onShortlist,
}: CoachingShortlistCardProps) {
  const location = instituteLocationLine(institute) ?? "";
  const deliveryType = formatDeliveryType(institute.type);

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 border-b border-slate-100 p-3 dark:border-slate-800">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {institute.institute_name}
          </h3>
          {deliveryType ? (
            <p>
              <ExamCardHoverField label="Delivery type" value={deliveryType} />
            </p>
          ) : null}
        </div>
        <InstituteLogo institute={institute} className="h-16 w-16 shrink-0 p-1.5" />
      </div>

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <p className="line-clamp-3 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        {location ? (
          <p className="m-0">
            <ExamCardHoverField label="Location" value={location} />
          </p>
        ) : null}

        {institute.branches_number?.trim() ? (
          <p className="m-0">
            <ExamCardHoverField label="Branches" value={institute.branches_number.trim()} />
          </p>
        ) : null}

        {institute.student_strength?.trim() ? (
          <p className="m-0">
            <ExamCardHoverField label="Student strength" value={institute.student_strength.trim()} />
          </p>
        ) : null}

        <LinkedExamChips
          linkedExams={institute.linkedExams}
          linkFrom="dashboard-coaching-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />

        <div className="mt-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="themeButtonOutline"
              size="sm"
              href={detailHref}
              className="w-full justify-center !rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            >
              View
            </Button>
            <Button
              variant="themeButton"
              size="sm"
              href="/dashboard?section=applications"
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
                <FaHeart
                  className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                Shortlisted
              </>
            ) : (
              <>
                <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Shortlist coaching
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
