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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-lg bg-white/10 p-6 shadow-xl backdrop-blur-md border border-white/20 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-300 hover:text-white transition"
        >
          <FiX className="h-6 w-6" />
        </button>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Apply for {examName}</h2>
            <p className="text-sm text-slate-300">
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
              <h3 className="mb-3 text-base font-semibold text-slate-50">Subject Breakdown</h3>
              <p className="mb-4 text-xs text-slate-400">
                Enter your subject-wise scores for {examName}
              </p>
              
              <SubjectInputList
                subjects={subjects}
                onChange={(newSubjects) => setSubjects(newSubjects)}
              />
            </div>

            <div className="flex gap-4 pt-4 border-t border-white/10">
              <Button
                type="button"
                variant="themeButtonOutline"
                size="md"
                className="flex-1"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="DarkGradient"
                size="md"
                className="flex-1"
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

