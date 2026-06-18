"use client";

import React, { useMemo, useState, useEffect } from "react";
import { FiX, FiRefreshCw, FiSearch } from "react-icons/fi";
import { Button, Notification } from "@/components/shared";
import { getAllExams, type Exam } from "@/api/exams";
import {
  examApplicationButtonLabel,
  getExamApplicationWindowStatus,
  isExamApplicationButtonEnabled,
} from "@/lib/examDisplay";
import { addExamToApplications } from "@/lib/examApplicationApi";

interface StudentExamCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationAdded: (message: string) => void;
}

export function StudentExamCreateModal({
  isOpen,
  onClose,
  onApplicationAdded,
}: StudentExamCreateModalProps) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState("");
  const [selectedExamId, setSelectedExamId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setSelectedExamId(null);
      setError(null);
      return;
    }

    const loadExams = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await getAllExams();
        if (!response.success || !response.data?.exams) {
          throw new Error(response.message || "Failed to load exams");
        }
        setExams(response.data.exams);
      } catch (err) {
        console.error("Error loading exams:", err);
        setError(err instanceof Error ? err.message : "Failed to load exams. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadExams();
  }, [isOpen]);

  const filteredExams = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exams;
    return exams.filter((exam) => {
      const haystack = [exam.name, exam.code, exam.abbreviation]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [exams, search]);

  const selectedExam = exams.find((e) => e.id === selectedExamId) ?? null;
  const selectedCanApply =
    selectedExam != null &&
    isExamApplicationButtonEnabled(getExamApplicationWindowStatus(selectedExam));

  const handleSubmit = async () => {
    if (!selectedExamId || !selectedExam) {
      setError("Please select an exam");
      return;
    }

    if (!selectedCanApply) {
      setError("This exam is not open for applications yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addExamToApplications(selectedExamId);
      if (!result.ok) {
        throw new Error(result.message);
      }

      onApplicationAdded(
        result.created
          ? "Exam added to My Applications."
          : "This exam is already in My Applications."
      );
      onClose();
    } catch (err) {
      console.error("Error creating application:", err);
      setError(err instanceof Error ? err.message : "Failed to add application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="relative flex max-h-[90vh] w-full max-w-lg flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="space-y-4 border-b border-slate-100 p-6 pb-4 dark:border-slate-800">
          <div>
            <h2 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Add Application</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search all exams and add one to My Applications when applications are open.
            </p>
          </div>

          <div className="relative">
            <FiSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by exam name or code..."
              className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none ring-black/5 focus:border-slate-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            />
          </div>
        </div>

        {error ? (
          <div className="px-6 pt-3">
            <Notification type="error" message={error} onClose={() => setError(null)} />
          </div>
        ) : null}

        <div className="min-h-[240px] flex-1 overflow-y-auto px-6 py-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <FiRefreshCw className="h-6 w-6 animate-spin text-slate-400" />
              <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Loading exams...</span>
            </div>
          ) : filteredExams.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
              No exams match your search.
            </div>
          ) : (
            <div className="space-y-2">
              {filteredExams.map((exam) => {
                const windowStatus = getExamApplicationWindowStatus(exam);
                const canApply = isExamApplicationButtonEnabled(windowStatus);
                const statusLabel = examApplicationButtonLabel(windowStatus);
                const isSelected = selectedExamId === exam.id;

                return (
                  <button
                    key={exam.id}
                    type="button"
                    disabled={!canApply}
                    onClick={() => canApply && setSelectedExamId(exam.id)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      !canApply
                        ? "cursor-not-allowed border-slate-100 bg-slate-50 opacity-70 dark:border-slate-800 dark:bg-slate-900/50"
                        : isSelected
                          ? "border-2 border-slate-900 bg-slate-50 dark:border-[#FAD53C] dark:bg-[#FAD53C]/10"
                          : "border border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`font-medium ${
                          isSelected
                            ? "text-slate-900 dark:text-white"
                            : "text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        {exam.name}
                      </p>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          canApply
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    {exam.code ? (
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{exam.code}</p>
                    ) : null}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-slate-100 p-6 pt-4 dark:border-slate-800">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="flex-1 !rounded-full"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="themeButton"
            size="md"
            className="flex-1 !rounded-full !border-black !bg-black !text-[#FAD53C] hover:!bg-black/90"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedExamId || !selectedCanApply || isLoading}
          >
            {isSubmitting ? (
              <>
                <FiRefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add to My Applications"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default StudentExamCreateModal;
