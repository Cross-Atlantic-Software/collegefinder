"use client";

import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import { Button, Notification } from "@/components/shared";
import { SubjectInputList } from "./SubjectInputList";

interface ExamApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  examName: string;
  examId?: string;
  onSubmit?: (data: {
    examId?: string;
    subjects: Array<{ name: string; percent: number }>;
  }) => void;
}

export function ExamApplicationModal({
  isOpen,
  onClose,
  examName,
  examId,
  onSubmit,
}: ExamApplicationModalProps) {
  const [subjects, setSubjects] = useState<Array<{ name: string; percent: number }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (subjects.length === 0) {
      setError("Please add at least one subject");
      return;
    }

    // Validate all subjects have name and percent
    const invalidSubjects = subjects.some(
      (subj) => !subj.name.trim() || subj.percent < 0 || subj.percent > 100
    );

    if (invalidSubjects) {
      setError("Please ensure all subjects have valid names and percentages (0-100)");
      return;
    }

    setSubmitting(true);

    try {
      // Call onSubmit callback if provided
      if (onSubmit) {
        await onSubmit({
          examId,
          subjects: subjects.filter((s) => s.name.trim() && s.percent >= 0 && s.percent <= 100),
        });
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSubjects([]);
        setSuccess(false);
      }, 1500);
    } catch (err) {
      setError("Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm dark:bg-black/60">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto dark:bg-slate-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <FiX className="h-5 w-5" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Apply for {examName}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Please provide your subject-wise scores for this exam
            </p>
          </div>

          {error && (
            <Notification
              type="error"
              message={error}
              onClose={() => setError(null)}
            />
          )}

          {success && (
            <Notification
              type="success"
              message="Application submitted successfully!"
              onClose={() => setSuccess(false)}
              autoClose={true}
              duration={2000}
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h3 className="mb-1.5 text-base font-semibold text-slate-900 dark:text-slate-100">Subject Breakdown</h3>
              <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
                Enter your subject-wise scores for {examName}
              </p>
              
              <SubjectInputList
                subjects={subjects}
                onChange={(newSubjects) => setSubjects(newSubjects)}
              />
            </div>

            <div className="flex gap-3 pt-5 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                size="md"
                className="flex-1 !rounded-full"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="themeButton"
                size="md"
                className="flex-1 !rounded-full bg-black text-[#FAD53C] hover:bg-black/90 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                disabled={submitting || subjects.length === 0}
              >
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

