"use client";

import type { ExamDetailSection } from "@/lib/examDisplay";

type ExamDetailSectionsProps = {
  sections: ExamDetailSection[];
};

const FULL_WIDTH_EXAM_FIELDS = new Set([
  "Description",
  "Eligibility",
  "Documents Required",
  "Counselling",
  "Exam Pattern",
  "Weightage of Subjects",
  "Programs",
]);

export function ExamDetailSections({ sections }: ExamDetailSectionsProps) {
  const hasAnyValue = sections.some((s) =>
    s.fields.some((f) => f.value.trim() && f.value !== "—")
  );
  if (!hasAnyValue) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        No exam details have been added in admin yet. Add dates, eligibility, pattern, and cutoff
        data under Admin → Exams.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <article key={section.id} className="rounded-2xl bg-white p-5 dark:bg-slate-900">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            {section.title}
          </h2>
          <dl className="mt-4 space-y-2 md:grid md:grid-cols-2 md:items-start md:gap-3 md:space-y-0">
            {section.fields.map((item) => (
              <div
                key={`${section.id}-${item.label}`}
                className={`rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950 ${
                  FULL_WIDTH_EXAM_FIELDS.has(item.label) ? "md:col-span-2" : ""
                }`}
              >
                <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">
                  <span className="whitespace-pre-wrap break-words">{item.value}</span>
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
