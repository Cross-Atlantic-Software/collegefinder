"use client";

import type { Exam } from "@/api/exams";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { ExamCardFields } from "@/components/dashboard/ExamCardFields";
import { ExamCardHeader } from "@/components/dashboard/ExamCardHeader";

export type ExamShortlistCardProps = {
  exam: Exam;
  name: string;
  detailHref: string;
  tabSource: string;
  isShortlisted: boolean;
  shortlistSaving: boolean;
  onShortlist: () => void;
  onApply?: () => void;
  onPrefetchDetail?: () => void;
  onApplyMissingLink?: () => void;
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
  onApplyMissingLink,
}: ExamShortlistCardProps) {
  const registrationUrl = exam.registration_link?.trim();
  const applyHref = registrationUrl
    ? (registrationUrl.startsWith("http") ? registrationUrl : `https://${registrationUrl}`)
    : undefined;
  // Apply is gated on an admin-approved ExamFill adapter. Until then the extension
  // has no validated mapping to run, so we surface "Waiting for Admin Approval".
  const isApplyReady = exam.is_apply_ready === true;

  return (
    <article className="group flex h-full flex-col overflow-visible rounded-2xl bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900">
      <ExamCardHeader exam={exam} name={name} />

      <div className="relative flex flex-1 flex-col gap-2 overflow-visible p-3 pt-2.5">
        <div className="absolute right-2 top-2 z-10">
          <CardShortlistHeart
            isShortlisted={isShortlisted}
            shortlistSaving={shortlistSaving}
            onShortlist={onShortlist}
            itemLabel={name}
          />
        </div>

        <ExamCardFields exam={exam} overviewClassName="pr-8" linkFrom="exam-shortlist" />

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
            {isApplyReady ? (
              <Button
                variant="themeButton"
                size="sm"
                type="button"
                onClick={() => {
                  if (applyHref) {
                    window.open(applyHref, "_blank", "noopener,noreferrer");
                    return;
                  }
                  (onApplyMissingLink ?? onApply)?.();
                }}
                className="w-full justify-center !rounded-full !border-black !bg-black !text-[#FAD53C] shadow-sm transition-all duration-200 hover:!bg-black/90 active:scale-95"
              >
                Apply
              </Button>
            ) : (
              <Button
                variant="themeButton"
                size="sm"
                type="button"
                disabled
                title="This exam's form filling is awaiting admin approval."
                className="w-full cursor-not-allowed justify-center !rounded-full !border-slate-200 !bg-slate-100 !text-slate-400 shadow-none dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-500"
              >
                Waiting for Admin Approval
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
