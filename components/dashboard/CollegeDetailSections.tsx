"use client";

import type { CollegeDetailSection } from "@/lib/collegeDisplay";

type CollegeDetailSectionsProps = {
  sections: CollegeDetailSection[];
};

export function CollegeDetailSections({ sections }: CollegeDetailSectionsProps) {
  const hasAnyValue = sections.some((s) => s.items.some((i) => i.value.trim() && i.value !== "—"));
  if (!hasAnyValue) {
    return (
      <div className="rounded-2xl bg-white p-6 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
        This college has no extended details in the database yet. Add description, programs, dates,
        and exams in Admin → Colleges.
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
          <dl className="mt-4 space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0">
            {section.items.map((item) => (
              <div
                key={`${section.id}-${item.label}-${item.value.slice(0, 24)}`}
                className="rounded-lg bg-[#F6F8FA] px-3 py-2 dark:bg-slate-950"
              >
                <dt className="text-xs text-slate-500 dark:text-slate-400">{item.label}</dt>
                <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">
                  {item.label === "Website" || item.label === "Brochure" ? (
                    <a
                      href={
                        item.value.startsWith("http")
                          ? item.value
                          : `https://${item.value}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="break-all font-medium text-[#b88900] underline-offset-2 hover:underline"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <span className="whitespace-pre-wrap break-words">{item.value}</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </article>
      ))}
    </div>
  );
}
