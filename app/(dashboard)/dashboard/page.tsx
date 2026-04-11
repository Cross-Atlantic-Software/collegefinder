"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getAcademics,
  getAllStreamsPublic,
  getBasicInfo,
  getProfileCompletion,
} from "@/api";
import { ApplicationsPage, ExamPreparation, MiddleContent, ReferralCard, Sidebar, TopBar, TestModule } from "@/components/dashboard";
import { ShortlistExams, ShortlistColleges } from "@/components/dashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileTabs from "@/components/dashboard/ProfileTabs/ProfileTabs";
import KnowYourStrengths from "@/components/dashboard/KnowYourStrengths";
import StrengthPaymentReturnHandler from "@/components/dashboard/KnowYourStrengths/StrengthPaymentReturnHandler";
import AdmissionHelp from "@/components/dashboard/AdmissionHelp";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "applications"
  | "exam-prep"
  | "test-module"
  | "know-your-strengths"
  | "admission-help"
  | "referral";

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [examPrepMode, setExamPrepMode] = useState<"self" | "coaching">("self");
  const [dashboardProfile, setDashboardProfile] = useState({
    fullName: "User",
    airRank: "—",
    stream: "—",
    targetIntake: "—",
    profileStrength: 0,
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [basicRes, academicsRes, completionRes, streamsRes] = await Promise.all([
          getBasicInfo(),
          getAcademics(),
          getProfileCompletion(),
          getAllStreamsPublic(),
        ]);
        if (cancelled) return;

        const basic = basicRes.success ? basicRes.data : null;
        const academics =
          academicsRes.success && academicsRes.data != null ? academicsRes.data : null;
        const streams =
          streamsRes.success && streamsRes.data?.streams ? streamsRes.data.streams : [];
        const pct =
          completionRes.success && completionRes.data?.percentage != null
            ? completionRes.data.percentage
            : 0;

        const fromParts = [basic?.first_name, basic?.last_name]
          .filter((p): p is string => Boolean(p?.trim()))
          .join(" ")
          .trim();
        const fullName =
          fromParts || basic?.name?.trim() || "User";

        const streamId = academics?.stream_id;
        const streamFromTaxonomy =
          streamId != null
            ? streams.find((s) => String(s.id) === String(streamId))?.name?.trim() ?? ""
            : "";
        const stream =
          streamFromTaxonomy ||
          academics?.stream?.trim() ||
          "—";

        setDashboardProfile({
          fullName,
          airRank: "—",
          stream,
          targetIntake: "—",
          profileStrength: pct,
        });
      } catch {
        /* keep defaults */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const section = searchParams.get("section") as SectionId | null;
    if (section) {
      setActiveSection(section);
    }
    const mode = searchParams.get("mode") as "self" | "coaching" | null;
    if (mode === "self" || mode === "coaching") {
      setExamPrepMode(mode);
    }
  }, [searchParams]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const toggleSidebarCollapse = () => setSidebarCollapsed((v) => !v);

  const fullWidthSections: SectionId[] = [
    "profile",
    "exam-shortlist",
    "college-shortlist",
    "applications",
    "exam-prep",
    "test-module",
    "know-your-strengths",
    "admission-help",
    "referral",
  ];

  return (
    <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Suspense fallback={null}>
        <StrengthPaymentReturnHandler
          onNavigateToStrengths={() => setActiveSection("know-your-strengths")}
        />
      </Suspense>
      {/* LEFT SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        activeSubSection={examPrepMode}
        onSubSectionChange={(id) => setExamPrepMode(id as "self" | "coaching")}
      />

      {/* MAIN AREA */}
      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={toggleSidebar}
          onToggleCollapse={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex flex-1 overflow-hidden bg-[#F6F8FA] dark:bg-slate-950">
          {activeSection === "dashboard" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <DashboardHeader
                fullName={dashboardProfile.fullName}
                airRank={dashboardProfile.airRank}
                stream={dashboardProfile.stream}
                targetIntake={dashboardProfile.targetIntake}
                profileStrength={dashboardProfile.profileStrength}
              />

              <div className="flex-1 overflow-y-auto px-4 pb-4 pt-2 md:px-6 md:pb-4 md:pt-2">
                <main className="min-w-0">
                  <MiddleContent />
                </main>
              </div>
            </div>
          ) : (
            <div
              className={[
                "flex flex-1 flex-col lg:flex-row lg:items-start overflow-y-auto",
                fullWidthSections.includes(activeSection)
                  ? "px-0 py-0"
                  : "gap-4 px-4 py-4 md:px-6 md:py-4",
              ].join(" ")}
            >
              {/* MIDDLE BAR */}
              <main className="flex-1 min-w-0">
                {activeSection === "profile" && (
                  <div className="w-full">
                    <ProfileTabs />
                  </div>
                )}

                {activeSection === "exam-shortlist" && <ShortlistExams />}

                {activeSection === "college-shortlist" && <ShortlistColleges />}

                {activeSection === "applications" && (
                  <ApplicationsPage />
                )}

                {activeSection === "exam-prep" && (
                  <ExamPreparation initialMode={examPrepMode} />
                )}

                {activeSection === "test-module" && (
                  <TestModule />
                )}

                {activeSection === "know-your-strengths" && (
                  <KnowYourStrengths onSectionChange={(section) => setActiveSection(section as SectionId)} />
                )}

                {activeSection === "admission-help" && (
                  <AdmissionHelp onSectionChange={(section) => setActiveSection(section as SectionId)} />
                )}

                {activeSection === "referral" && <ReferralCard />}
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
