"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, TopBar, type DashboardSectionId } from "@/components/dashboard";
import { DetailShortlistButton } from "@/components/dashboard/DetailShortlistButton";
import { CollegeDetailSections } from "@/components/dashboard/CollegeDetailSections";
import { DetailRecommendedExamsCTA } from "@/components/dashboard/DetailRecommendedExamsCTA";
import { ExamDetailRecommendedVideos } from "@/components/dashboard/ExamDetailRecommendedVideos";
import { QuickSelfStudyPicks } from "@/components/dashboard/QuickSelfStudyPicks";
import { InstituteLogo } from "@/components/dashboard/InstituteLogo";
import {
  buildInstituteDetailSections,
  instituteLocationLine,
  instituteModeLabel,
  isInstituteOnlineMode,
} from "@/lib/instituteDisplay";
import { useInstituteDetailQuery } from "@/lib/instituteDetailQueries";
import { useUpdateShortlistedInstituteMutation } from "@/lib/dashboardInstituteQueries";


const SOURCE_BREADCRUMBS: Record<string, Array<{ label: string; href?: string }>> = {
  "dashboard-coaching-online": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
    { label: "Online" },
  ],
  "dashboard-coaching-offline": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
    { label: "Offline" },
  ],
  "dashboard-coaching-shortlist": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
    { label: "Shortlisted" },
  ],
};

function instituteViewFrom(from: string): string {
  if (from === "dashboard-coaching-online") return "dashboard-coaching-online";
  if (from === "dashboard-coaching-offline") return "dashboard-coaching-offline";
  return "dashboard-coaching-shortlist";
}

function DetailShell({
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
        activeSection="coaching-institutes"
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

export default function InstituteDetailPage() {
  const router = useRouter();
  const params = useParams<{ instituteId: string }>();
  const searchParams = useSearchParams();
  const instituteRef = decodeURIComponent(params.instituteId || "");
  const from = searchParams.get("from") || "";

  const { data, isLoading, isError, error } = useInstituteDetailQuery(instituteRef);
  const updateShortlist = useUpdateShortlistedInstituteMutation();

  const institute = data?.institute;
  const shortlistedIds = (data?.shortlistedInstituteIds ?? []).map(Number);
  const isShortlisted = institute ? shortlistedIds.includes(institute.id) : false;
  const taggedLectureCount = data?.taggedLectureCount ?? 0;
  const taggedLecturePreviews = data?.taggedLecturePreviews ?? [];

  const sections = useMemo(
    () => (institute ? buildInstituteDetailSections(institute) : []),
    [institute]
  );

  const isOnline = institute ? isInstituteOnlineMode(institute.type) : false;
  const mode = institute ? instituteModeLabel(institute.type) : null;
  const location = institute && !isOnline ? instituteLocationLine(institute) : null;
  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
  ];
  const examLinkFrom = instituteViewFrom(from);

  const handleSectionChange = (section: DashboardSectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  if (isLoading) {
    return (
      <DetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto w-full px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-sm text-slate-500 dark:bg-slate-900 dark:text-slate-400">
            Loading coaching institute details...
          </div>
        </div>
      </DetailShell>
    );
  }

  if (isError || !institute) {
    return (
      <DetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto w-full px-4 py-8 md:px-6">
          <div className="rounded-2xl bg-white p-8 text-center dark:bg-slate-900">
            <p className="text-sm text-red-600 dark:text-red-400">
              {error instanceof Error ? error.message : "Coaching institute not found."}
            </p>
            <Button
              variant="themeButtonOutline"
              size="sm"
              href="/dashboard?section=coaching-institutes"
              className="mt-4 !rounded-full"
            >
              Back to Coaching Institutes
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
          <div className="flex items-center gap-3">
            <InstituteLogo institute={institute} className="h-14 w-14 shrink-0 p-1.5" />
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 md:text-[2rem]">
                {institute.institute_name}
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                {[mode, location].filter(Boolean).join(" · ") || "Coaching institute"}
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
            <span className="font-semibold text-slate-700 dark:text-slate-200">
              {institute.institute_name}
            </span>
          </div>
        </div>
      </section>

      <div className="px-4 py-4 md:px-6" style={{ animation: "fade-in 220ms ease-out" }}>
        <div className="mx-auto grid w-full grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
          <div className="space-y-4">
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
                      instituteId: institute.id,
                      shortlisted: !isShortlisted,
                    })
                  }
                  shortlistLabel="Shortlist coaching"
                />
                {institute.website?.trim() ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={
                      institute.website.startsWith("http")
                        ? institute.website
                        : `https://${institute.website}`
                    }
                  >
                    Visit website
                  </Button>
                ) : null}
                {institute.google_maps_link?.trim() ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={institute.google_maps_link}
                  >
                    Open in Google Maps
                  </Button>
                ) : null}
                {institute.contact_number?.trim() ? (
                  <Button
                    variant="themeButtonOutline"
                    size="sm"
                    className="w-full justify-center rounded-full"
                    href={`tel:${institute.contact_number.replace(/\s/g, "")}`}
                  >
                    Call institute
                  </Button>
                ) : null}
                <Button
                  variant="themeButtonOutline"
                  size="sm"
                  className="w-full justify-center rounded-full"
                  href="/dashboard?section=coaching-institutes"
                >
                  Back to coaching list
                </Button>
              </div>
            </div>
            <QuickSelfStudyPicks variant="sidebar" />
            <DetailRecommendedExamsCTA
              linkedExams={institute.linkedExams}
              linkFrom={examLinkFrom}
              subtitle="Mapped via coaching exams."
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
