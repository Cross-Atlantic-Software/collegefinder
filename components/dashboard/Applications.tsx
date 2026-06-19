// components/dashboard/Applications.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MdAdd, MdRefresh, MdWarning, MdClose } from "react-icons/md";
import { FiPlay, FiRefreshCw, FiAlertCircle } from "react-icons/fi";
import { Button } from "@/components/shared";
import { StudentExamCreateModal } from "./StudentExamCreateModal";
import { getApiBaseUrl } from "@/api/client";
import {
  formatApplicationDate,
  formatApplicationFee,
  formatUtServiceFee,
  getApplicationDisplayStatus,
  getApplicationMissingFields,
  openRegistrationUrl,
  type StudentApplication,
} from "@/lib/applicationDisplay";
import { APPLICATIONS_NOTICE_KEY } from "@/lib/examApplicationApi";
import {
  deductCreditsForRegistration,
  refundCreditsForRegistration,
} from "@/api/credits";

function getDisplayStatusStyles(displayStatus: ReturnType<typeof getApplicationDisplayStatus>) {
  switch (displayStatus) {
    case "In Process":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300";
    case "Filled":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Applied":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "Failed":
      return "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function ApplicationTableRow({
  app,
  onStartProcessing,
  processingAppId,
}: {
  app: StudentApplication;
  onStartProcessing: (app: StudentApplication) => void;
  processingAppId: number | null;
}) {
  const detailHref = `/dashboard/exams/${app.taxonomy_exam_id ?? app.exam_slug ?? app.exam_id}?from=dashboard-applications`;
  const displayStatus = getApplicationDisplayStatus(app);
  const missingFields = getApplicationMissingFields(app);
  const canStartProcessing =
    app.status === "approved" ||
    app.status === "failed" ||
    (app.status === "completed" && app.source !== "already_filled_form");

  return (
    <tr className="border-b border-slate-100 text-xs dark:border-slate-800">
      <td className="px-3 py-3 align-top">
        <Link
          href={detailHref}
          className="font-semibold text-slate-900 transition-colors hover:text-black dark:text-slate-100 dark:hover:text-white"
        >
          {app.exam_name}
        </Link>
        {missingFields.length > 0 ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {missingFields.map((field) => (
              <span
                key={field}
                className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                title={`Missing: ${field}`}
              >
                <MdWarning className="h-3 w-3 shrink-0" />
                {field}
              </span>
            ))}
          </div>
        ) : null}
      </td>
      <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-300">
        {formatApplicationDate(app.application_start_date)}
      </td>
      <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-300">
        {formatApplicationDate(app.application_close_date)}
      </td>
      <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-300">
        {formatApplicationFee(app.application_fees)}
      </td>
      <td className="px-3 py-3 align-top text-slate-700 dark:text-slate-300">
        {formatUtServiceFee(app.ut_service_fee)}
      </td>
      <td className="px-3 py-3 align-top">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getDisplayStatusStyles(displayStatus)}`}
        >
          {displayStatus}
        </span>
      </td>
      <td className="px-3 py-3 align-top">
        {canStartProcessing ? (
          <Button
            variant="themeButton"
            size="sm"
            className="flex items-center gap-1.5 rounded-full !border-black !bg-black !px-3 !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
            onClick={() => onStartProcessing(app)}
            disabled={processingAppId === app.id}
          >
            <FiPlay className="h-3 w-3" />
            {processingAppId === app.id ? "Processing…" : "Start Processing"}
          </Button>
        ) : (
          <span className="text-[11px] text-slate-400 dark:text-slate-500">—</span>
        )}
      </td>
    </tr>
  );
}

function InsufficientCreditsModal({
  isOpen,
  message,
  examName,
  onClose,
  onPurchaseCredits,
}: {
  isOpen: boolean;
  message: string;
  examName?: string;
  onClose: () => void;
  onPurchaseCredits: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-credits-title"
      >
        <div className="flex items-start justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FiAlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <h2 id="insufficient-credits-title" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Insufficient UT Credits
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            aria-label="Close"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          {examName ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam: <span className="font-medium text-slate-700 dark:text-slate-300">{examName}</span>
            </p>
          ) : null}
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{message}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Purchase more credits from the UT Credits wallet to continue registration.
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-800">
          <Button
            variant="themeButtonOutline"
            size="sm"
            className="rounded-full"
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="themeButton"
            size="sm"
            className="rounded-full !border-black !bg-black !text-[#FAD53C] hover:!bg-black/90"
            onClick={onPurchaseCredits}
          >
            Go to UT Credits
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applyNotice, setApplyNotice] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [processingAppId, setProcessingAppId] = useState<number | null>(null);
  const [creditErrorModal, setCreditErrorModal] = useState<{
    message: string;
    examName?: string;
  } | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`${getApiBaseUrl()}/user/automation-applications`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      } as RequestInit);

      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const data = await response.json();
      setApplications(data.data || []);
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError("Failed to load applications. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
    const notice = sessionStorage.getItem(APPLICATIONS_NOTICE_KEY);
    if (notice) {
      sessionStorage.removeItem(APPLICATIONS_NOTICE_KEY);
      setApplyNotice(notice);
    }
  }, [fetchApplications]);

  useEffect(() => {
    if (!applyNotice) return;
    const timer = window.setTimeout(() => setApplyNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [applyNotice]);

  const handleStartProcessing = async (app: StudentApplication) => {
    setError(null);
    setCreditErrorModal(null);
    setProcessingAppId(app.id);

    try {
      const fee = app.ut_service_fee != null ? Number(app.ut_service_fee) : 0;
      if (fee > 0) {
        const deductRes = await deductCreditsForRegistration(app.id);
        if (!deductRes.success) {
          const message = deductRes.message || "Failed to deduct UT Credits";
          if (message.toLowerCase().includes("insufficient")) {
            setCreditErrorModal({ message, examName: app.exam_name });
          } else {
            setError(message);
          }
          return;
        }
      }

      const opened = openRegistrationUrl(app.exam_url);
      if (!opened) {
        if (fee > 0) {
          await refundCreditsForRegistration(app.id, "Registration link unavailable");
        }
        setError("Registration link is not available for this exam yet.");
        return;
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to start processing. Please try again.";
      if (message.toLowerCase().includes("insufficient")) {
        setCreditErrorModal({ message, examName: app.exam_name });
      } else {
        console.error("Start processing error:", err);
        setError(message);
      }
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleGoToUtCredits = () => {
    setCreditErrorModal(null);
    router.push("/dashboard?section=ut-credits");
  };

  const handleApplicationAdded = (message: string) => {
    setApplyNotice(message);
    void fetchApplications();
  };

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                My Applications
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Track exam applications and start processing when you are ready.
              </p>
            </div>
            <Button
              variant="themeButton"
              size="sm"
              className="flex items-center gap-2 rounded-full !border-black !bg-black !px-4 !py-2 !text-[#FAD53C] transition-all duration-200 hover:!bg-black/90 active:scale-95"
              onClick={() => setShowCreateModal(true)}
            >
              <MdAdd className="h-4 w-4" />
              Add Application
            </Button>
          </div>
        </header>

        <div
          className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6"
          style={{ animation: "fade-in 220ms ease-out" }}
        >
          <main className="flex flex-col gap-4">
            <div className="flex justify-end">
              <button
                onClick={fetchApplications}
                disabled={isLoading}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              >
                <MdRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>

            {applyNotice ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                {applyNotice}
              </div>
            ) : null}

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            ) : null}

            <section>
              {isLoading ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                  <FiRefreshCw className="h-5 w-5 animate-spin" />
                  Loading applications...
                </div>
              ) : applications.length === 0 ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                  <p>No applications yet.</p>
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all duration-200 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900 active:scale-95 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                    onClick={() => setShowCreateModal(true)}
                  >
                    Add your first application
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <table className="min-w-[980px] w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        <th className="px-3 py-3">Exam Name</th>
                        <th className="px-3 py-3">Application Start</th>
                        <th className="px-3 py-3">Application End</th>
                        <th className="px-3 py-3">Form Fee</th>
                        <th className="px-3 py-3">UT Service Fee</th>
                        <th className="px-3 py-3">Progress</th>
                        <th className="px-3 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {applications.map((app) => (
                        <ApplicationTableRow
                          key={app.id}
                          app={app}
                          onStartProcessing={handleStartProcessing}
                          processingAppId={processingAppId}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <StudentExamCreateModal
              isOpen={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              onApplicationAdded={handleApplicationAdded}
            />

            <InsufficientCreditsModal
              isOpen={creditErrorModal != null}
              message={creditErrorModal?.message ?? ""}
              examName={creditErrorModal?.examName}
              onClose={() => setCreditErrorModal(null)}
              onPurchaseCredits={handleGoToUtCredits}
            />
          </main>
        </div>
      </section>
    </div>
  );
}
