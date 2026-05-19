"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { MdSchool } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, TopBar } from "@/components/dashboard";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import { ExamDetailLinkedColleges } from "@/components/dashboard/ExamDetailLinkedColleges";
import { ExamDetailSections } from "@/components/dashboard/ExamDetailSections";
import {
  buildExamDetailSections,
  examCardSubtitle,
  examLevelBadge,
} from "@/lib/examDisplay";
import { useExamDetailQuery } from "@/lib/examDetailQueries";
import { useExamLinkedCollegesQuery } from "@/lib/examLinkedCollegesQueries";
import {
  useDashboardExamsMetaQuery,
  useUpdateShortlistedExamMutation,
} from "@/lib/dashboardExamShortlistQueries";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "coaching-institutes"
  | "scholarships"
  | "applications"
  | "exam-prep"
  | "test-module"
  | "know-your-strengths"
  | "admission-help"
  | "referral";

const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "profile-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Profile", href: "/dashboard?section=profile" },
    { label: "Recommended Exams" },
  ],
  "dashboard-shortlist-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Recommended" },
  ],
  "dashboard-shortlist-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "Shortlisted" },
  ],
  "dashboard-shortlist-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
    { label: "All Exams" },
  ],
  "dashboard-applications": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Applications", href: "/dashboard?section=applications" },
  ],
  "widget-eligible": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Eligible Exams Widget" },
  ],
  "widget-deadlines": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Upcoming Deadlines Widget" },
  ],
  "exam-directory": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Directory", href: "/dashboard/exams" },
  ],
};

function ExamDetailShell({
  children,
  sidebarOpen,
  setSidebarOpen,
  sidebarCollapsed,
  setSidebarCollapsed,
  onSectionChange,
}: {
  children: React.ReactNode;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean | ((p: boolean) => boolean)) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean | ((p: boolean) => boolean)) => void;
  onSectionChange: (section: SectionId) => void;
}) {
  return (
    <div className="flex h-screen bg-[#F6F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection="exam-shortlist"
        onSectionChange={onSectionChange}
      />
      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <div className="flex-1 overflow-y-auto bg-[#F6F8FA] dark:bg-slate-950">{children}</div>
      </div>
    </div>
  );
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams<{ examId: string }>();
  const searchParams = useSearchParams();
  const examId = decodeURIComponent(params.examId || "");
  const from = searchParams.get("from") || "";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  const { data: pageData, isLoading, isError, error } = useExamDetailQuery(examId);
  const exam = pageData?.exam;
  const examNumericId = exam ? Number(exam.id) : null;
  const { data: linkedCollegesData, isLoading: collegesLoading } =
    useExamLinkedCollegesQuery(examNumericId);
  const linkedColleges =
    linkedCollegesData?.colleges ?? pageData?.linkedColleges ?? [];
  const linkedCollegesTotal =
    linkedCollegesData?.totalCount ?? pageData?.linkedCollegesTotal ?? 0;
  const { data: examMeta } = useDashboardExamsMetaQuery();
  const updateShortlist = useUpdateShortlistedExamMutation();

  const sections = useMemo(() => (exam ? buildExamDetailSections(exam) : []), [exam]);
  const levelBadge = exam ? examLevelBadge(exam.exam_type) : null;
  const subtitle = exam ? examCardSubtitle(exam) : null;

  const shortlistedIds = examMeta?.shortlistedExamIds ?? [];
  const isShortlisted =
    examNumericId != null && shortlistedIds.includes(examNumericId);
  const shortlistSaving =
    updateShortlist.isPending && updateShortlist.variables?.examId === examNumericId;

  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Directory", href: "/dashboard/exams" },
  ];

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  const toggleShortlist = () => {
    if (examNumericId == null || updateShortlist.isPending) return;
    updateShortlist.mutate({
      examId: examNumericId,
      shortlisted: !isShortlisted,
    });
  };

  if (isLoading) {
    return (
      <ExamDetailShell
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onSectionChange={handleSectionChange}
      >
        <div className="px-4 py-4 md:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Loading exam details...
          </div>
        </div>
      </ExamDetailShell>
    );
  }

  if (isError || !exam) {
    return (
      <ExamDetailShell
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        onSectionChange={handleSectionChange}
      >
        <div className="px-4 py-4 md:px-6">
          <div className="mx-auto max-w-6xl rounded-2xl bg-white p-8 dark:bg-slate-900">
            <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Exam not found</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {error instanceof Error ? error.message : "This exam could not be loaded."}
            </p>
            <Button
              variant="themeButtonOutline"
              size="sm"
              href="/dashboard?section=exam-shortlist"
              className="mt-4"
            >
              Back to exams
            </Button>
          </div>
        </div>
      </ExamDetailShell>
    );
  }

  return (
    <ExamDetailShell
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      sidebarCollapsed={sidebarCollapsed}
      setSidebarCollapsed={setSidebarCollapsed}
      onSectionChange={handleSectionChange}
    >
      <section className="bg-white dark:bg-slate-900">
        <div className="px-4 py-4 md:px-6">
          <div className="mx-auto flex max-w-6xl gap-4 md:gap-6">
            <div className="min-w-0 flex-1">
              {levelBadge ? (
                <span className="mb-2 inline-block rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-slate-700">
                  {levelBadge}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
                {exam.name}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
            <ExamLogo exam={exam} className="h-24 w-24 shrink-0 p-2 md:h-28 md:w-28" />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 py-2 md:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
            <span className="font-semibold text-slate-700 dark:text-slate-200">{exam.name}</span>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 md:px-6">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <ExamDetailSections sections={sections} />
            <ExamDetailLinkedColleges
              colleges={linkedColleges}
              totalCount={linkedCollegesTotal}
              isLoading={collegesLoading && !!exam}
            />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next steps</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Shortlist this exam or continue your application journey.
              </p>
              <div className="mt-3 space-y-2">
                <Button
                  type="button"
                  variant={isShortlisted ? "themeButtonOutline" : "themeButton"}
                  size="sm"
                  className="w-full justify-center !rounded-full"
                  onClick={toggleShortlist}
                  disabled={shortlistSaving}
                >
                  {shortlistSaving ? (
                    "Saving..."
                  ) : isShortlisted ? (
                    <>
                      <FaHeart className="h-4 w-4 shrink-0" aria-hidden />
                      Shortlisted
                    </>
                  ) : (
                    <>
                      <FaRegHeart className="h-4 w-4 shrink-0" aria-hidden />
                      Shortlist exam
                    </>
                  )}
                </Button>
                <Button
                  variant="themeButton"
                  size="sm"
                  className="w-full justify-center !rounded-full"
                  href="/dashboard?section=applications"
                >
                  <MdSchool className="h-4 w-4" /> Start Application
                </Button>
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  className="w-full justify-center !rounded-full"
                  href="/dashboard?section=exam-shortlist"
                >
                  Back to exam list
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </ExamDetailShell>
  );
}
