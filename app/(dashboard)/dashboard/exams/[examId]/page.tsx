"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiExternalLink } from "react-icons/fi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import ExamLinkedColleges from "@/components/dashboard/ExamLinkedColleges";
import DashboardPageShell, { type DashboardSectionId } from "@/components/dashboard/DashboardPageShell";
import { useExamDetailQuery } from "@/lib/examDetailQueries";
import {
  useDashboardExamsMetaQuery,
  useUpdateShortlistedExamMutation,
} from "@/lib/dashboardExamShortlistQueries";
import {
  buildExamDetailSections,
  examLogoSrc,
  formatExamTypeLabel,
  formatPopularityRank,
  NOT_CONFIGURED,
  type ExamDetailField,
} from "@/lib/examDisplay";

const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "profile-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Profile", href: "/dashboard?section=profile" },
    { label: "Recommended Exams" },
  ],
  "dashboard-shortlist-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Recommended exams" },
  ],
  "dashboard-shortlist-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Shortlisted exams" },
  ],
  "dashboard-shortlist-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "All exams" },
  ],
  "dashboard-applications": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Applications", href: "/dashboard?section=applications" },
  ],
};

const BLOCK_FIELD_LABELS = new Set(["Documents required", "Counselling", "Subject weightage"]);

function isExternalUrl(value: string): boolean {
  if (value === NOT_CONFIGURED) return false;
  const t = value.trim();
  return /^https?:\/\//i.test(t) || /^www\./i.test(t) || (t.includes(".") && !t.includes(" "));
}

function externalHref(value: string): string {
  const t = value.trim();
  return /^https?:\/\//i.test(t) ? t : `https://${t}`;
}

function DetailFieldRow({ label, value }: ExamDetailField) {
  const empty = value === NOT_CONFIGURED;
  const block = BLOCK_FIELD_LABELS.has(label);
  const url = isExternalUrl(value);

  return (
    <div className={block ? "sm:col-span-2" : undefined}>
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={`mt-1 text-sm font-medium ${
          empty ? "text-slate-400 dark:text-slate-500" : "text-slate-900 dark:text-slate-100"
        } ${block ? "whitespace-pre-wrap leading-relaxed" : ""}`}
      >
        {url ? (
          <a
            href={externalHref(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline"
          >
            {value}
            <FiExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70" />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}

function DetailSection({ title, fields }: { title: string; fields: ExamDetailField[] }) {
  return (
    <article className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <DetailFieldRow key={field.label} {...field} />
        ))}
      </dl>
    </article>
  );
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const examId = decodeURIComponent(params.examId || "");
  const from = searchParams.get("from") || "";

  const {
    data: exam,
    isLoading: loading,
    isError: examLoadError,
    error: examLoadErrorDetail,
  } = useExamDetailQuery(examId);

  const logoSrc = useMemo(() => (exam ? examLogoSrc(exam) : "/cbse.png"), [exam]);
  const logoRemote = logoSrc.startsWith("http");
  const examName = exam?.name || "Exam";

  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
  ];

  const detailSections = useMemo(() => (exam ? buildExamDetailSections(exam) : []), [exam]);
  const popularity = exam ? formatPopularityRank(exam) : null;
  const careerGoals = exam?.linkedCareerGoals ?? [];
  const programs = exam?.linkedPrograms ?? [];
  const linkedColleges = exam?.linkedColleges ?? [];

  const { data: examMeta } = useDashboardExamsMetaQuery();
  const updateShortlist = useUpdateShortlistedExamMutation();
  const shortlistedIds = examMeta?.shortlistedExamIds ?? [];
  const examNumericId = exam ? Number(exam.id) : 0;
  const isShortlisted =
    examNumericId > 0 && shortlistedIds.some((id) => Number(id) === examNumericId);
  const shortlistSaving = updateShortlist.isPending;

  const toggleShortlist = () => {
    if (!exam || shortlistSaving || examNumericId < 1) return;
    updateShortlist.mutate({
      examId: examNumericId,
      shortlisted: !isShortlisted,
    });
  };

  const handleSectionChange = (section: DashboardSectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  if (loading && !exam) {
    return (
      <DashboardPageShell activeSection="exam-shortlist" onSectionChange={handleSectionChange}>
        <div className="px-4 py-4 md:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Loading exam details...
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (examLoadError || (!loading && !exam)) {
    const errMsg =
      examLoadErrorDetail instanceof Error ? examLoadErrorDetail.message : "Exam not found";
    return (
      <DashboardPageShell activeSection="exam-shortlist" onSectionChange={handleSectionChange}>
        <div className="px-4 py-4 md:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl border border-red-200 bg-red-50 p-8 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-200">
            <p className="font-semibold">Could not load this exam</p>
            <p className="mt-2">{errMsg}</p>
            <Link
              href="/dashboard?section=exam-shortlist"
              className="mt-4 inline-block font-semibold text-[#341050] underline dark:text-violet-300"
            >
              Back to exams
            </Link>
          </div>
        </div>
      </DashboardPageShell>
    );
  }

  if (!exam) return null;

  const description = exam.description?.trim() || NOT_CONFIGURED;
  const descriptionEmpty = description === NOT_CONFIGURED;

  return (
    <DashboardPageShell activeSection="exam-shortlist" onSectionChange={handleSectionChange}>
      <section className="bg-white dark:bg-slate-900">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-2 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
              <Image
                src={logoSrc}
                alt={examName}
                width={88}
                height={52}
                className="max-h-full max-w-full object-contain"
                priority
                unoptimized={logoRemote}
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
                {examName}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {exam.code?.trim() || NOT_CONFIGURED}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatExamTypeLabel(exam.exam_type) || NOT_CONFIGURED}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {exam.conducting_authority?.trim() || NOT_CONFIGURED}
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                {popularity ? `Popularity rank #${popularity}` : `Popularity rank: ${NOT_CONFIGURED}`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 py-2 md:px-6">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            {breadcrumbTrail.map((crumb, index) => (
              <div key={`${crumb.label}-${index}`} className="inline-flex items-center gap-1.5">
                {index > 0 && <ChevronRight className="h-3 w-3" />}
                {crumb.href ? (
                  <Link
                    href={crumb.href}
                    className="font-medium text-black/70 hover:text-black hover:underline dark:text-slate-200 dark:hover:text-white"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
              </div>
            ))}
            <ChevronRight className="h-3 w-3" />
            <span className="font-semibold text-slate-700 dark:text-slate-200">{examName}</span>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 md:px-6">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          <section className="space-y-5">
            <article className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">About this exam</h2>
              <p
                className={`mt-2 whitespace-pre-wrap text-sm leading-relaxed ${
                  descriptionEmpty
                    ? "text-slate-400 dark:text-slate-500"
                    : "text-slate-700 dark:text-slate-300"
                }`}
              >
                {description}
              </p>
            </article>

            {detailSections.map((section) => (
              <DetailSection key={section.id} title={section.title} fields={section.fields} />
            ))}

            <article className="rounded-2xl border border-slate-100 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Career goals & programs
              </h2>
              <div className="mt-4 space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Career goals</p>
                  {careerGoals.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {careerGoals.map((g) => {
                        const logo = g.logo?.trim();
                        const goalLogoRemote = Boolean(logo?.startsWith("http"));
                        return (
                          <li
                            key={`cg-${g.id}`}
                            className="inline-flex items-center gap-2 rounded-full bg-[#F6F8FA] px-3 py-1.5 text-xs font-medium text-slate-800 dark:bg-slate-950 dark:text-slate-200"
                          >
                            {logo ? (
                              <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                                <Image
                                  src={logo}
                                  alt=""
                                  width={24}
                                  height={24}
                                  className="h-5 w-5 object-contain"
                                  unoptimized={goalLogoRemote}
                                />
                              </span>
                            ) : null}
                            {g.label}
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{NOT_CONFIGURED}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Programs</p>
                  {programs.length > 0 ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {programs.map((p) => (
                        <li
                          key={`pg-${p.id}`}
                          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {p.name}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">{NOT_CONFIGURED}</p>
                  )}
                </div>
              </div>
            </article>

            <ExamLinkedColleges
              colleges={linkedColleges}
              from={from || "exam-detail"}
            />
          </section>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</p>
              <div className="mt-3 space-y-2">
                <Button
                  variant="themeButton"
                  size="sm"
                  className="w-full justify-center rounded-full"
                  href="/dashboard?section=applications"
                >
                  Start application
                </Button>
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  type="button"
                  onClick={toggleShortlist}
                  disabled={shortlistSaving}
                  aria-pressed={isShortlisted}
                  className="w-full justify-center rounded-full"
                >
                  {shortlistSaving ? (
                    "Saving..."
                  ) : isShortlisted ? (
                    <>
                      <FaHeart className="h-3.5 w-3.5 shrink-0 text-rose-500" aria-hidden />
                      Shortlisted
                    </>
                  ) : (
                    <>
                      <FaRegHeart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      Shortlist
                    </>
                  )}
                </Button>
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  className="w-full justify-center rounded-full"
                  href="/dashboard?section=exam-shortlist"
                >
                  Back to exams
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardPageShell>
  );
}
