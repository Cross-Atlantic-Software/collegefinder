"use client";

import type { DashboardInstitute } from "@/api/auth/profile";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { CoachingCardMetaFields } from "@/components/dashboard/CoachingCardMetaFields";
import { ExamCardHoverField } from "@/components/dashboard/ExamCardHoverField";
import {
  LinkedExamChips,
  LINKED_EXAM_CHIPS_CARD_MAX,
} from "@/components/dashboard/LinkedExamChips";
import { InstituteLogo } from "@/components/dashboard/InstituteLogo";

export type CoachingShortlistCardProps = {
  institute: DashboardInstitute;
  detailHref: string;
  displayOverview: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
  /** Hide location on online institutes tab cards. */
  hideLocation?: boolean;
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
  hideLocation = false,
}: CoachingShortlistCardProps) {
  const deliveryType = formatDeliveryType(institute.type);

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <div className="flex gap-3 p-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="line-clamp-2 text-xs font-semibold leading-snug text-slate-900 dark:text-slate-100">
            {institute.institute_name}
          </h3>
          {deliveryType ? (
            <p>
              <ExamCardHoverField label="Mode" value={deliveryType} />
            </p>
          ) : null}
        </div>
        <InstituteLogo institute={institute} className="h-20 w-20 shrink-0 rounded-xl" />
      </div>

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2">
        <div className="absolute right-2 top-2 z-10">
          <CardShortlistHeart
            isShortlisted={isShortlisted}
            shortlistSaving={shortlistSaving}
            onShortlist={onShortlist}
            itemLabel={institute.institute_name}
          />
        </div>

        <p className="line-clamp-3 pr-8 text-[11px] leading-snug text-slate-600 dark:text-slate-400">
          {displayOverview}
        </p>

        <CoachingCardMetaFields institute={institute} hideLocation={hideLocation} />

        <LinkedExamChips
          linkedExams={institute.linkedExams}
          linkFrom="dashboard-coaching-shortlist"
          maxVisible={LINKED_EXAM_CHIPS_CARD_MAX}
        />

        <div className="mt-auto pt-3">
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
        </div>
      </div>
    </article>
  );
}
