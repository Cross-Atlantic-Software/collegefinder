"use client";

import { useState } from "react";
import { MdSchool } from "react-icons/md";
import { Button } from "@/components/shared";
import type { ExamExtraField } from "@/lib/examApplicationApi";

interface ExamExtraFieldsModalProps {
  isOpen: boolean;
  examName: string;
  fields: ExamExtraField[];
  saving: boolean;
  error: string | null;
  onSkip: () => void;
  onSubmit: (values: Record<string, string>) => void;
}

/**
 * Contextual prompt shown at Apply time when an exam's adapter references
 * discovered.* profile fields the student hasn't filled yet. Collects just
 * those fields and hands the values back; "Skip for now" applies without them.
 */
export function ExamExtraFieldsModal({
  isOpen,
  examName,
  fields,
  saving,
  error,
  onSkip,
  onSubmit,
}: ExamExtraFieldsModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const setVal = (path: string, v: string) =>
    setValues((prev) => ({ ...prev, [path]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl dark:bg-gray-900">
        <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            A few details {examName} needs
          </h2>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            We&apos;ll save these to your profile so this form can be filled automatically.
          </p>
        </div>

        <div className="space-y-3 px-5 py-4">
          {fields.map((f) => (
            <div key={f.field_path}>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                {f.label}
              </label>
              <input
                type={f.type === "date" ? "date" : "text"}
                value={values[f.field_path] || ""}
                onChange={(e) => setVal(f.field_path, e.target.value)}
                disabled={saving}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-[#341050] focus:ring-2 focus:ring-[#341050]/20 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          ))}
          {error ? <p className="text-xs text-red-600 dark:text-red-400">{error}</p> : null}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-3 dark:border-gray-800">
          <Button
            variant="themeButtonOutline"
            size="sm"
            className="!rounded-full"
            disabled={saving}
            onClick={onSkip}
          >
            Skip for now
          </Button>
          <Button
            variant="themeButton"
            size="sm"
            className="!rounded-full"
            disabled={saving}
            onClick={() => onSubmit(values)}
          >
            <MdSchool className="h-4 w-4" /> {saving ? "Saving..." : "Save & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
