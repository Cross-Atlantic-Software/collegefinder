"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, TopBar } from "@/components/dashboard";
import { DetailShortlistButton } from "@/components/dashboard/DetailShortlistButton";
import { CollegeDetailSections } from "@/components/dashboard/CollegeDetailSections";
import { DetailRecommendedExamsCTA } from "@/components/dashboard/DetailRecommendedExamsCTA";
import { ExamDetailRecommendedVideos } from "@/components/dashboard/ExamDetailRecommendedVideos";
import { buildScholarshipDetailSections } from "@/lib/scholarshipDisplay";
import { useScholarshipDetailQuery } from "@/lib/scholarshipDetailQueries";
import { useUpdateShortlistedScholarshipMutation } from "@/lib/dashboardScholarshipQueries";
import { collegeDetailHref } from "@/lib/collegeSlug";

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
  "dashboard-scholarship-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "Recommended" },
  ],
  "dashboard-scholarship-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "Shortlist" },
  ],
  "dashboard-scholarship-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "All" },
  ],
  "exam-detail": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam detail" },
  ],
};

function DetailShell({
  children,
  onSectionChange,
}: {
  children: React.ReactNode;
  onSectionChange: (section: SectionId) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-[#F6F8FA] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection="scholarships"
        onSectionChange={onSectionChange}
        loadShortlistCounts={false}
      />
      <div className="flex h-screen flex-1 flex-col">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default function ScholarshipDetailPage() {
  const router = useRouter();
  const params = useParams<{ scholarshipId: string }>();
  const searchParams = useSearchParams();
  const scholarshipRef = decodeURIComponent(params.scholarshipId || "");
  const from = searchParams.get("from") || "";

  const { data, isLoading, isError, error } = useScholarshipDetailQuery(scholarshipRef);
  const updateShortlist = useUpdateShortlistedScholarshipMutation();

  const scholarship = data?.scholarship;
  const shortlistedIds = (data?.shortlistedScholarshipIds ?? []).map(Number);
  const isShortlisted = scholarship ? shortlistedIds.includes(scholarship.id) : false;
  const taggedLectureCount = data?.taggedLectureCount ?? 0;
  const taggedLecturePreviews = data?.taggedLecturePreviews ?? [];

  const sections = useMemo(
    () => (scholarship ? buildScholarshipDetailSections(scholarship) : []),
    [scholarship]
  );

  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
  ];

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  const applicationUrl = scholarship?.application_link?.trim() || null;
  const websiteUrl = scholarship?.official_website?.trim() || null;

  if (isLoading) {
    return (
      <DetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Loading scholarship details...
          </div>
        </div>
      </DetailShell>
    );
  }

  if (isError || !scholarship) {
    return (
      <DetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-900">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "Scholarship not found."}
            </p>
            <Button
              variant="themeButtonOutline"
              size="sm"
              href="/dashboard?section=scholarships"
              className="mt-4 !rounded-full"
            >
              Back to Scholarships
            </Button>
          </div>
        </div>
      </DetailShell>
    );
  }

  return (
    <DetailShell onSectionChange={handleSectionChange}>
      <section className="bg-white dark:bg-slate-900">
        <div className="px-4 py-3 md:px-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
              {scholarship.scholarship_name}
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {[
                scholarship.scholarship_type,
                scholarship.conducting_authority,
                scholarship.scholarship_amount,
              ]
                .filter(Boolean)
                .join(" · ") || "Scholarship"}
            </p>
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
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {scholarship.scholarship_name}
            </span>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 md:px-6" style={{ animation: "fade-in 220ms ease-out" }}>
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {scholarship.linkedColleges && scholarship.linkedColleges.length > 0 ? (
              <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Linked Colleges
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {scholarship.linkedColleges.map((college) => (
                    <Link
                      key={college.id}
                      href={collegeDetailHref(college.name, "dashboard-scholarship-shortlist")}
                      className="max-w-full truncate rounded-full bg-[#f0f4fa] px-2 py-0.5 text-[10px] font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                    >
                      {college.name}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
            <CollegeDetailSections sections={sections} />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</p>
              <div className="mt-3 space-y-2">
                <DetailShortlistButton
                  isShortlisted={isShortlisted}
                  isSaving={updateShortlist.isPending}
                  onClick={() =>
                    updateShortlist.mutate({
                      scholarshipId: scholarship.id,
                      shortlisted: !isShortlisted,
                    })
                  }
                  shortlistLabel="Shortlist scholarship"
                />
                {applicationUrl ? (
                  <Button
                    variant="themeButton"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={
                      applicationUrl.startsWith("http")
                        ? applicationUrl
                        : `https://${applicationUrl}`
                    }
                  >
                    Apply online
                  </Button>
                ) : null}
                {websiteUrl ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={
                      websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`
                    }
                  >
                    Official website
                  </Button>
                ) : null}
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  className="w-full justify-center rounded-full"
                  href="/dashboard?section=scholarships"
                >
                  Back to scholarships
                </Button>
              </div>
            </div>
            <DetailRecommendedExamsCTA
              linkedExams={scholarship.linkedExams}
              linkFrom="dashboard-scholarship-shortlist"
              subtitle="Mapped via scholarship exams and colleges."
            />
            <ExamDetailRecommendedVideos
              count={taggedLectureCount}
              lectures={taggedLecturePreviews}
              subtitle="Tagged for linked exams in Exam Prep."
            />
          </aside>
        </div>
      </div>
    </DetailShell>
  );
}
