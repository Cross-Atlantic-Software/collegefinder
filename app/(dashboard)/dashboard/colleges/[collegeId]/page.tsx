"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiTrendingUp } from "react-icons/fi";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, TopBar, type DashboardSectionId } from "@/components/dashboard";
import { DetailShortlistButton } from "@/components/dashboard/DetailShortlistButton";
import { CollegeDetailSections } from "@/components/dashboard/CollegeDetailSections";
import { CollegeDetailRecommendedExams } from "@/components/dashboard/CollegeDetailRecommendedExams";
import { ExamDetailRecommendedVideos } from "@/components/dashboard/ExamDetailRecommendedVideos";
import { buildCollegeDetailSections, collegeLocationLine } from "@/lib/collegeDisplay";
import { useCollegeDetailQuery } from "@/lib/collegeDetailQueries";
import { useUpdateShortlistedCollegeMutation } from "@/lib/dashboardCollegeShortlistQueries";
import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";


const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "dashboard-college-shortlist-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "Recommended" },
  ],
  "dashboard-college-shortlist-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "Shortlisted" },
  ],
  "dashboard-college-shortlist-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
    { label: "All Colleges" },
  ],
  "exam-detail": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
  ],
  "exam-card": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
  ],
  "exam-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Exam Shortlist", href: "/dashboard?section=exam-shortlist" },
  ],
  "dashboard-scholarship-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "Shortlist" },
  ],
  "dashboard-scholarship-recommended": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "Recommended" },
  ],
  "dashboard-scholarship-shortlisted": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "Shortlisted" },
  ],
  "dashboard-scholarship-all": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Scholarships", href: "/dashboard?section=scholarships" },
    { label: "All" },
  ],
};

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

function CollegeDetailShell({
  children,
  onSectionChange,
}: {
  children: React.ReactNode;
  onSectionChange: (section: DashboardSectionId) => void;
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
        activeSection="college-shortlist"
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

export default function CollegeDetailPage() {
  const router = useRouter();
  const params = useParams<{ collegeId: string }>();
  const searchParams = useSearchParams();
  const collegeRef = decodeURIComponent(params.collegeId || "");
  const from = searchParams.get("from") || "";

  const { data, isLoading, isError, error } = useCollegeDetailQuery(collegeRef);
  const updateShortlist = useUpdateShortlistedCollegeMutation();

  const college = data?.college;
  const shortlistedIds = (data?.shortlistedCollegeIds ?? []).map(Number);
  const isShortlisted = college ? shortlistedIds.includes(college.id) : false;
  const taggedLectureCount = data?.taggedLectureCount ?? 0;
  const taggedLecturePreviews = data?.taggedLecturePreviews ?? [];

  const sections = useMemo(
    () => (college ? buildCollegeDetailSections(college) : []),
    [college]
  );

  const logoSrc =
    (college && resolveCollegeLogoSrc(college)) ||
    LOCAL_COLLEGE_IMAGES[Math.abs(college?.id ?? 0) % LOCAL_COLLEGE_IMAGES.length];

  const location = college ? collegeLocationLine(college) : null;
  const headerSubtitle = college
    ? [
        college.nirf_ranking != null ? `NIRF #${college.nirf_ranking}` : null,
        college.college_type,
        location,
      ]
        .filter(Boolean)
        .join(" · ") || "College"
    : "College";
  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "College Shortlist", href: "/dashboard?section=college-shortlist" },
  ];

  const handleSectionChange = (section: DashboardSectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  if (isLoading) {
    return (
      <CollegeDetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto w-full px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Loading college details...
          </div>
        </div>
      </CollegeDetailShell>
    );
  }

  if (isError || !college) {
    return (
      <CollegeDetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto w-full px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-900">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "College not found."}
            </p>
            <Button
              variant="themeButtonOutline"
              size="sm"
              href="/dashboard?section=college-shortlist"
              className="mt-4 !rounded-full"
            >
              Back to College Shortlist
            </Button>
          </div>
        </div>
      </CollegeDetailShell>
    );
  }

  return (
    <CollegeDetailShell onSectionChange={handleSectionChange}>
      <section className="bg-white dark:bg-slate-900">
        <div className="px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-1 ring-slate-200 dark:ring-slate-700">
              <Image
                src={logoSrc}
                alt=""
                fill
                className="object-cover"
                sizes="44px"
                priority
              />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
                {college.college_name}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {headerSubtitle}
              </p>
              {college.admission_timeline?.trim() ? (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {college.admission_timeline}
                </p>
              ) : null}
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
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {college.college_name}
            </span>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 md:px-6" style={{ animation: "fade-in 220ms ease-out" }}>
        <div className="mx-auto grid w-full grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            <CollegeDetailSections sections={sections} />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 md:p-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Actions
              </p>
              <div className="mt-3 space-y-2">
                <DetailShortlistButton
                  isShortlisted={isShortlisted}
                  isSaving={updateShortlist.isPending}
                  onClick={() =>
                    updateShortlist.mutate({
                      collegeId: college.id,
                      shortlisted: !isShortlisted,
                    })
                  }
                  shortlistLabel="Shortlist college"
                />
                {college.website?.trim() ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={
                      college.website.startsWith("http")
                        ? college.website
                        : `https://${college.website}`
                    }
                  >
                    Visit website
                  </Button>
                ) : null}
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  className="w-full justify-center rounded-full"
                  href="/dashboard?section=college-shortlist"
                >
                  <FiTrendingUp className="h-4 w-4" /> Back to shortlist
                </Button>
              </div>
            </div>
            <CollegeDetailRecommendedExams college={college} />
            <ExamDetailRecommendedVideos
              count={taggedLectureCount}
              lectures={taggedLecturePreviews}
              subtitle="Tagged for linked exams in Exam Prep."
            />
          </aside>
        </div>
      </div>
    </CollegeDetailShell>
  );
}
