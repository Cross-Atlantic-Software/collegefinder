"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { FiBookmark } from "react-icons/fi";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/shared";
import { Sidebar, TopBar } from "@/components/dashboard";
import { CollegeDetailSections } from "@/components/dashboard/CollegeDetailSections";
import { InstituteLogo } from "@/components/dashboard/InstituteLogo";
import { LinkedExamChips } from "@/components/dashboard/LinkedExamChips";
import {
  buildInstituteDetailSections,
  instituteLocationLine,
} from "@/lib/instituteDisplay";
import { useInstituteDetailQuery } from "@/lib/instituteDetailQueries";
import { useUpdateShortlistedInstituteMutation } from "@/lib/dashboardInstituteQueries";

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

function formatDeliveryType(type: string | null | undefined): string | null {
  const t = type?.trim().toLowerCase();
  if (t === "online") return "Online";
  if (t === "offline") return "Offline";
  if (t === "hybrid") return "Hybrid";
  return type?.trim() || null;
}

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

  const sections = useMemo(
    () => (institute ? buildInstituteDetailSections(institute) : []),
    [institute]
  );

  const location = institute ? instituteLocationLine(institute) : null;
  const deliveryType = institute ? formatDeliveryType(institute.type) : null;
  const breadcrumbTrail = SOURCE_BREADCRUMBS[from] || [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Coaching Institutes", href: "/dashboard?section=coaching-institutes" },
  ];

  const handleSectionChange = (section: SectionId) => {
    router.push(`/dashboard?section=${section}`);
  };

  if (isLoading) {
    return (
      <DetailShell onSectionChange={handleSectionChange}>
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
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
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
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
                {[deliveryType, location].filter(Boolean).join(" · ") || "Coaching institute"}
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
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-5 xl:grid-cols-[1fr_280px]">
          <div className="space-y-4">
            {institute.linkedExams && institute.linkedExams.length > 0 ? (
              <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Linked exams
                </p>
                <div className="mt-2">
                  <LinkedExamChips
                    linkedExams={institute.linkedExams}
                    linkFrom="dashboard-coaching-shortlist"
                  />
                </div>
              </div>
            ) : null}
            <CollegeDetailSections sections={sections} />
          </div>

          <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
            <div className="rounded-2xl bg-white p-4 dark:bg-slate-900">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Actions</p>
              <div className="mt-3 space-y-2">
                <Button
                  variant={isShortlisted ? "secondary" : "themeButton"}
                  size="sm"
                  className="w-full justify-center rounded-full"
                  disabled={updateShortlist.isPending}
                  onClick={() =>
                    updateShortlist.mutate({
                      instituteId: institute.id,
                      shortlisted: !isShortlisted,
                    })
                  }
                >
                  <FiBookmark className="h-4 w-4" />{" "}
                  {updateShortlist.isPending
                    ? "Saving..."
                    : isShortlisted
                      ? "Shortlisted"
                      : "Shortlist coaching"}
                </Button>
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
          </aside>
        </div>
      </div>
    </DetailShell>
  );
}
