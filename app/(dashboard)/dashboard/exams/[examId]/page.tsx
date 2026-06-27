"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { MdSchool } from "react-icons/md";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, type DashboardSectionId } from "@/components/dashboard";
import { DetailShortlistButton } from "@/components/dashboard/DetailShortlistButton";
import { ExamLogo } from "@/components/dashboard/ExamLogo";
import { ExamDetailRecommendedVideos } from "@/components/dashboard/ExamDetailRecommendedVideos";
import { ExamDetailSections } from "@/components/dashboard/ExamDetailSections";
import { ExamDetailMappedColleges } from "@/components/dashboard/ExamDetailMappedColleges";
import { DetailMappingCarousel } from "@/components/dashboard/DetailMappingCarousel";
import {
  buildExamDetailSections,
  examCardSubtitle,
  examLevelBadge,
  getExamApplicationWindowStatus,
  isExamApplicationButtonEnabled,
} from "@/lib/examDisplay";
import { scholarshipDetailHref } from "@/lib/scholarshipSlug";
import {
  instituteExamDetailStatsLine,
  instituteLocationLine,
  instituteModeLabel,
} from "@/lib/instituteDisplay";
import { slugifyInstituteName } from "@/lib/instituteSlug";
import { addExamToApplications, APPLICATIONS_NOTICE_KEY } from "@/lib/examApplicationApi";
import { useExamDetailQuery } from "@/lib/examDetailQueries";
import { useExamLinkedCollegesQuery } from "@/lib/examLinkedCollegesQueries";
import { useExamLinkedInstitutesQuery } from "@/lib/examLinkedInstitutesQueries";
import {
  useDashboardExamsMetaQuery,
  useUpdateShortlistedExamMutation,
  useUpdateAlreadyFilledFormMutation,
} from "@/lib/dashboardExamShortlistQueries";


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
  "dashboard-college-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
  ],
  "dashboard-coaching-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
  ],
  "dashboard-scholarship-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
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
  onSectionChange: (section: DashboardSectionId) => void;
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
        loadShortlistCounts={false}
      />
      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
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
  const [startApplicationSaving, setStartApplicationSaving] = useState(false);
  const [startApplicationError, setStartApplicationError] = useState<string | null>(null);

  const { data: pageData, isLoading, isError, error } = useExamDetailQuery(examId);
  const exam = pageData?.exam;
  const examNumericId = exam ? Number(exam.id) : null;
  const { data: linkedCollegesData } = useExamLinkedCollegesQuery(examNumericId);
  const linkedColleges =
    linkedCollegesData?.colleges ?? pageData?.linkedColleges ?? [];
  const linkedCollegesTotal =
    linkedCollegesData?.totalCount ?? pageData?.linkedCollegesTotal ?? 0;
  const { data: linkedInstitutesData } = useExamLinkedInstitutesQuery(examNumericId);
  const linkedInstitutes = linkedInstitutesData?.institutes ?? [];
  const linkedInstitutesTotal = linkedInstitutesData?.totalCount ?? 0;
  const linkedScholarships = pageData?.linkedScholarships ?? [];
  const linkedScholarshipTotal = pageData?.linkedScholarshipTotal ?? 0;
  const taggedLectureCount = pageData?.taggedLectureCount ?? 0;
  const taggedLecturePreviews = pageData?.taggedLecturePreviews ?? [];
  const { data: examMeta } = useDashboardExamsMetaQuery();
  const updateShortlist = useUpdateShortlistedExamMutation();
  const updateAlreadyFilled = useUpdateAlreadyFilledFormMutation();

  const sections = useMemo(() => (exam ? buildExamDetailSections(exam) : []), [exam]);
  const levelBadge = exam ? examLevelBadge(exam.exam_type) : null;
  const subtitle = exam ? examCardSubtitle(exam) : null;
  const websiteUrl = exam?.website?.trim() || null;

  const scholarshipMappingItems = useMemo(
    () =>
      linkedScholarships.map((s) => ({
        id: s.id,
        title: s.scholarship_name,
        subtitle:
          s.scholarship_type?.trim() || s.conducting_authority?.trim() || "Scholarship",
        meta: s.scholarship_amount?.trim() || null,
        href: scholarshipDetailHref(s.scholarship_name, "exam-detail"),
      })),
    [linkedScholarships]
  );
  const coachingMappingItems = useMemo(
    () =>
      linkedInstitutes.map((i) => ({
        id: i.id,
        title: i.institute_name,
        subtitle: instituteModeLabel(i.type) || "Coaching",
        meta: instituteExamDetailStatsLine(i) || instituteLocationLine(i),
        href: `/dashboard/institutes/${slugifyInstituteName(i.institute_name)}?from=exam-detail`,
      })),
    [linkedInstitutes]
  );

  const shortlistedIds = examMeta?.shortlistedExamIds ?? [];
  const alreadyFilledIds = examMeta?.alreadyFilledFormExamIds ?? [];
  const isShortlisted =
    examNumericId != null && shortlistedIds.includes(examNumericId);
  const isAlreadyFilled =
    examNumericId != null && alreadyFilledIds.includes(examNumericId);
  const shortlistSaving =
    updateShortlist.isPending && updateShortlist.variables?.examId === examNumericId;
  const alreadyFilledSaving =
    updateAlreadyFilled.isPending && updateAlreadyFilled.variables?.examId === examNumericId;

  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Directory", href: "/dashboard/exams" },
  ];

  const handleSectionChange = (section: DashboardSectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  const toggleShortlist = () => {
    if (examNumericId == null || updateShortlist.isPending) return;
    updateShortlist.mutate({
      examId: examNumericId,
      shortlisted: !isShortlisted,
    });
  };

  const toggleAlreadyFilled = () => {
    if (examNumericId == null || updateAlreadyFilled.isPending) return;
    updateAlreadyFilled.mutate({
      examId: examNumericId,
      filled: !isAlreadyFilled,
    });
  };

  const canStartApplication =
    exam != null && isExamApplicationButtonEnabled(getExamApplicationWindowStatus(exam));

  const handleStartApplication = async () => {
    if (examNumericId == null || !canStartApplication || startApplicationSaving) return;
    setStartApplicationSaving(true);
    setStartApplicationError(null);
    try {
      const result = await addExamToApplications(examNumericId);
      if (!result.ok) {
        setStartApplicationError(result.message);
        return;
      }
      sessionStorage.setItem(APPLICATIONS_NOTICE_KEY, result.message);
      router.push("/dashboard?section=applications");
    } catch {
      setStartApplicationError("Could not add this exam to My Applications.");
    } finally {
      setStartApplicationSaving(false);
    }
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
          <div className="mx-auto w-full rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
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
          <div className="mx-auto w-full rounded-2xl bg-white p-8 dark:bg-slate-900">
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
        <div className="px-4 py-2.5 md:px-6">
          <div className="mx-auto flex items-center gap-3">
            <ExamLogo exam={exam} className="h-14 w-14 shrink-0 p-1.5" />
            <div className="min-w-0 flex-1">
              {levelBadge ? (
                <span className="mb-1 inline-block rounded-full bg-slate-900 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white dark:bg-slate-700">
                  {levelBadge}
                </span>
              ) : null}
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
                {exam.name}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 text-sm font-medium text-slate-600 dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="px-4 py-2 md:px-6">
          <div className="mx-auto flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
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
        <div className="mx-auto grid w-full grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
          <div className="space-y-4">
            <ExamDetailSections sections={sections} />
            <ExamDetailMappedColleges
              colleges={linkedColleges}
              totalCount={linkedCollegesTotal}
            />
          </div>

          <aside className={[
    "space-y-4 xl:sticky xl:top-6 xl:self-start",
    "xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto xl:overscroll-contain",
    "xl:pr-1 [scrollbar-width:thin]",
    "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent",
    "[&::-webkit-scrollbar-thumb]:rounded-lg [&::-webkit-scrollbar-thumb]:bg-black/90",
    "dark:[&::-webkit-scrollbar-thumb]:bg-[#FAD53C]/80",
  ].join(" ")}>
            <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Next steps</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Shortlist this exam or continue your application journey.
              </p>
              <div className="mt-3 space-y-2">
                <DetailShortlistButton
                  isShortlisted={isShortlisted}
                  isSaving={shortlistSaving}
                  onClick={toggleShortlist}
                  shortlistLabel="Shortlist exam"
                  disabled={examNumericId == null}
                />
                <Button
                  variant={isAlreadyFilled ? "themeButtonOutline" : "themeButton"}
                  size="sm"
                  className="w-full justify-center !rounded-full"
                  onClick={toggleAlreadyFilled}
                  disabled={examNumericId == null || alreadyFilledSaving}
                >
                  {alreadyFilledSaving
                    ? "Saving..."
                    : isAlreadyFilled
                      ? "Already Filled ✓"
                      : "Already Filled"}
                </Button>
                {websiteUrl ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center !rounded-full"
                    href={
                      websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
                    }
                  >
                    Visit website
                  </Button>
                ) : null}
                <Button
                  variant="themeButton"
                  size="sm"
                  className="w-full justify-center !rounded-full"
                  disabled={examNumericId == null || !canStartApplication || startApplicationSaving}
                  onClick={() => void handleStartApplication()}
                >
                  <MdSchool className="h-4 w-4" />{" "}
                  {startApplicationSaving ? "Adding..." : "Start Application"}
                </Button>
                {startApplicationError ? (
                  <p className="text-center text-xs text-red-600 dark:text-red-400">{startApplicationError}</p>
                ) : null}
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
            <DetailMappingCarousel
              title="Linked Scholarships"
              subtitle={`Scholarships tagged to this exam (${linkedScholarshipTotal} total).`}
              viewLabel="View Scholarship"
              items={scholarshipMappingItems}
            />
            <DetailMappingCarousel
              title="Coaching Institutes"
              subtitle={`Coachings offering this exam (${linkedInstitutesTotal} total).`}
              viewLabel="View Coaching"
              items={coachingMappingItems}
            />
            <ExamDetailRecommendedVideos
              count={taggedLectureCount}
              lectures={taggedLecturePreviews}
            />
          </aside>
        </div>
      </div>
    </ExamDetailShell>
  );
}
