"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

  useEffect(() => {
    const section = searchParams.get("section") as SectionId | null;
    if (section) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const toggleSidebarCollapse = () => setSidebarCollapsed((v) => !v);

  const dashboardProfile = {
    fullName: "Dinesh Sharma",
    airRank: "#2,340",
    stream: "Engineering",
    targetIntake: "2026",
    profileStrength: 85,
  };

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
                  <ExamPreparation />
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
