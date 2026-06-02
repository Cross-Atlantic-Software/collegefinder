"use client";

import { Fragment, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  Fingerprint,
  GraduationCap,
  Image as ImageIcon,
  ScrollText,
} from "lucide-react";
import type { CollegeDetailSection } from "@/lib/collegeDisplay";
import {
  formatInrAmount,
  buildProgramItems,
} from "@/lib/collegeDisplay";

type CollegeDetailSectionsProps = {
  sections: CollegeDetailSection[];
};

function documentIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes("photo") || n.includes("picture") || n.includes("passport")) {
    return ImageIcon;
  }
  if (n.includes("aadhaar") || n.includes("aadhar") || n.includes("id") || n.includes("identity")) {
    return Fingerprint;
  }
  if (n.includes("marksheet") || n.includes("certificate") || n.includes("score")) {
    return GraduationCap;
  }
  if (n.includes("affidavit") || n.includes("declaration") || n.includes("undertaking")) {
    return ScrollText;
  }
  return FileText;
}

function ProgramsTableSection({
  section,
}: {
  section: CollegeDetailSection;
}) {
  const programs = section.programs ?? [];
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!programs.length) return null;

  return (
    <article className="rounded-2xl bg-white p-4 dark:bg-slate-900 md:p-5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {section.title}
      </h2>
      <div className="mt-3 overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800">
        <table className="min-w-[640px] w-full text-left text-xs">
          <thead className="bg-[#F6F8FA] text-slate-500 dark:bg-slate-950 dark:text-slate-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Program</th>
              <th className="px-3 py-2 font-semibold">Branch</th>
              <th className="px-3 py-2 font-semibold">Duration</th>
              <th className="px-3 py-2 font-semibold">Intake</th>
              <th className="px-3 py-2 font-semibold">Total fee</th>
              <th className="px-3 py-2 font-semibold w-10" aria-label="Details" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {programs.map((p) => {
              const pid = p.id ?? p.program_id;
              const isOpen = expandedId === pid;
              const duration =
                p.duration_years != null
                  ? `${p.duration_years} ${p.duration_unit?.trim() || "years"}`
                  : "—";
              const details = buildProgramItems(p);

              return (
                <Fragment key={pid}>
                  <tr className="align-middle">
                    <td className="px-3 py-2.5 font-medium text-slate-900 dark:text-slate-100">
                      {p.program_name?.trim() || `Program #${p.program_id}`}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                      {p.branch_course?.trim() || "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">{duration}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                      {p.intake_capacity ?? "—"}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-slate-300">
                      {formatInrAmount(p.total_fee) || "—"}
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : pid)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400 dark:border-slate-700 dark:text-slate-300"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Collapse program details" : "Expand program details"}
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                  {isOpen && details.length > 0 ? (
                    <tr>
                      <td colSpan={6} className="bg-slate-50/80 px-3 py-3 dark:bg-slate-950/50">
                        <dl className="grid gap-2 md:grid-cols-2">
                          {details.map((item) => (
                            <div key={`${pid}-${item.label}`} className="rounded-lg px-2 py-1.5">
                              <dt className="text-[10px] uppercase tracking-wide text-slate-400">
                                {item.label}
                              </dt>
                              <dd className="mt-0.5 text-sm text-slate-800 dark:text-slate-200">
                                {item.label === "Brochure" ? (
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
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function DocumentsListSection({ section }: { section: CollegeDetailSection }) {
  const docs = section.documents ?? [];
  if (!docs.length) return null;

  return (
    <article className="rounded-2xl bg-white p-4 dark:bg-slate-900 md:p-5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {section.title}
      </h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {docs.map((doc, i) => {
          const name = doc.document_name?.trim() || `Document ${i + 1}`;
          const Icon = documentIcon(name);
          return (
            <li
              key={`${name}-${i}`}
              className="flex items-center gap-3 rounded-xl border border-slate-100 bg-[#F6F8FA] px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[#341050] shadow-sm dark:bg-slate-800 dark:text-[#FAD53C]">
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{name}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Required</p>
              </div>
            </li>
          );
        })}
      </ul>
    </article>
  );
}

function CounsellingTimelineSection({ section }: { section: CollegeDetailSection }) {
  const steps = section.counsellingSteps ?? [];
  if (!steps.length) return null;

  return (
    <article className="rounded-2xl bg-white p-4 dark:bg-slate-900 md:p-5">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {section.title}
      </h2>
      <ol className="relative mt-4 space-y-0 pl-1">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          return (
            <li key={`${step.step_number ?? index}-${index}`} className="relative flex gap-3 pb-5">
              {!isLast ? (
                <span
                  className="absolute left-[13px] top-7 h-[calc(100%-12px)] w-px bg-slate-200 dark:bg-slate-700"
                  aria-hidden
                />
              ) : null}
              <span className="relative z-[1] inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#341050] text-[11px] font-bold text-white dark:bg-[#FAD53C] dark:text-black">
                {step.step_number ?? index + 1}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                  Step {step.step_number ?? index + 1}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {step.description?.trim() || "—"}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    </article>
  );
}

export function CollegeDetailSections({ sections }: CollegeDetailSectionsProps) {
  const hasAnyValue = sections.some((s) => {
    if (s.kind === "programs-table") return (s.programs?.length ?? 0) > 0;
    if (s.kind === "documents-list") return (s.documents?.length ?? 0) > 0;
    if (s.kind === "counselling-timeline") return (s.counsellingSteps?.length ?? 0) > 0;
    return s.items.some((i) => i.value.trim() && i.value !== "—");
  });

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
      {sections.map((section) => {
        if (section.kind === "programs-table") {
          return <ProgramsTableSection key={section.id} section={section} />;
        }
        if (section.kind === "documents-list") {
          return <DocumentsListSection key={section.id} section={section} />;
        }
        if (section.kind === "counselling-timeline") {
          return <CounsellingTimelineSection key={section.id} section={section} />;
        }

        const visibleItems = section.items.filter(
          (i) => i.value.trim() && i.value !== "—"
        );
        if (!visibleItems.length) return null;

        const isOverview = section.id === "overview";
        const isCompactGrid =
          isOverview ||
          section.id === "statistics" ||
          section.id === "about" ||
          section.id === "eligibility";
        return (
          <article
            key={section.id}
            className="rounded-2xl bg-white p-4 dark:bg-slate-900 md:p-5"
          >
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {section.title}
            </h2>
            <dl
              className={`mt-3 gap-2 ${
                isCompactGrid
                  ? "grid sm:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2 md:grid md:grid-cols-2 md:gap-3 md:space-y-0"
              }`}
            >
              {visibleItems.map((item) => {
                const fullWidth =
                  item.label === "Description" ||
                  item.label === "Admission timeline" ||
                  item.label === "Admission Timeline" ||
                  item.label === "Required Documents" ||
                  item.label === "Selection Process" ||
                  item.label === "Renewal Conditions" ||
                  item.label === "Eligible Categories" ||
                  item.label === "Applicable States";
                return (
                  <div
                    key={`${section.id}-${item.label}-${item.value.slice(0, 24)}`}
                    className={`rounded-lg bg-[#F6F8FA] dark:bg-slate-950 ${
                      isCompactGrid ? "px-2.5 py-1.5" : "px-3 py-2"
                    } ${
                      fullWidth && !isCompactGrid ? "md:col-span-2" : ""
                    } ${fullWidth && isCompactGrid ? "sm:col-span-2 lg:col-span-3" : ""}`}
                  >
                    <dt
                      className={`text-slate-500 dark:text-slate-400 ${
                        isCompactGrid ? "text-[10px] font-medium uppercase tracking-wide" : "text-xs"
                      }`}
                    >
                      {item.label}
                    </dt>
                    <dd
                      className={`text-slate-800 dark:text-slate-200 ${
                        isCompactGrid ? "mt-0.5 text-[13px] leading-snug" : "mt-0.5 text-sm"
                      }`}
                    >
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
                );
              })}
            </dl>
          </article>
        );
      })}
    </div>
  );
}
