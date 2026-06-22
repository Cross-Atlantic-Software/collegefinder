"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Exam } from "@/api/exams";
import { Button } from "@/components/shared";
import { CardShortlistHeart } from "@/components/dashboard/CardShortlistHeart";
import { ExamCardFields } from "@/components/dashboard/ExamCardFields";
import { ExamCardHeader } from "@/components/dashboard/ExamCardHeader";
import {
  examApplicationButtonLabel,
  getExamApplicationWindowStatus,
  isExamApplicationButtonEnabled,
} from "@/lib/examDisplay";
import { addExamToApplications, APPLICATIONS_NOTICE_KEY } from "@/lib/examApplicationApi";

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
  onApplyError?: (message: string) => void;
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
  onApplyError,
}: ExamShortlistCardProps) {
  const router = useRouter();
  const [applySaving, setApplySaving] = useState(false);
  const applicationStatus = getExamApplicationWindowStatus(exam);
  const applyLabel = applySaving ? "Adding..." : examApplicationButtonLabel(applicationStatus);
  const applyEnabled = isExamApplicationButtonEnabled(applicationStatus) && !applySaving;
  // Apply is gated on an admin-approved ExamFill adapter. Until then the extension
  // has no validated mapping to run, so we surface "Awaiting approval".
  const isApplyReady = exam.is_apply_ready === true;

  const handleApply = async () => {
    if (!applyEnabled) return;

    if (onApply) {
      onApply();
      return;
    }

    setApplySaving(true);
    try {
      const result = await addExamToApplications(Number(exam.id));
      if (!result.ok) {
        onApplyError?.(result.message);
        return;
      }
      sessionStorage.setItem(APPLICATIONS_NOTICE_KEY, result.message);
      router.push("/dashboard?section=applications");
    } catch {
      onApplyError?.("Could not add this exam to My Applications.");
    } finally {
      setApplySaving(false);
    }
  };

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
            {!isApplyReady ? (
              <Button
                variant="themeButton"
                size="sm"
                type="button"
                disabled
                title="This exam's form filling is awaiting admin approval."
                className="w-full cursor-not-allowed justify-center truncate !rounded-full !border-slate-200 !bg-slate-100 !text-slate-400 shadow-none dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-500"
              >
                Awaiting approval
              </Button>
            ) : (
              <Button
                variant="themeButton"
                size="sm"
                type="button"
                disabled={!applyEnabled}
                onClick={() => void handleApply()}
                className={`w-full justify-center !rounded-full px-2 text-[11px] shadow-sm transition-all duration-200 sm:text-xs ${
                  applyEnabled
                    ? "!border-black !bg-black !text-[#FAD53C] hover:!bg-black/90 active:scale-95"
                    : "!cursor-not-allowed !border-slate-200 !bg-slate-100 !text-slate-500 hover:!bg-slate-100 dark:!border-slate-700 dark:!bg-slate-800 dark:!text-slate-400"
                }`}
              >
                {applyLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
