"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ApplicationsPage,
  ExamPreparation,
  MiddleContent,
  ReferralCard,
  Sidebar,
  TopBar,
  TestModule,
  ShortlistExams,
  ShortlistColleges,
  ShortlistInstitutes,
  ShortlistScholarships,
  Settings,
} from "@/components/dashboard";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ProfileTabs from "@/components/dashboard/ProfileTabs/ProfileTabs";
import KnowYourStrengths from "@/components/dashboard/KnowYourStrengths";
import StrengthPaymentReturnHandler from "@/components/dashboard/KnowYourStrengths/StrengthPaymentReturnHandler";
import AdmissionHelp from "@/components/dashboard/AdmissionHelp";
import Counselling from "@/components/dashboard/Counselling";
import UtCreditsWallet from "@/components/dashboard/UtCredits/UtCreditsWallet";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "college-shortlist"
  | "coaching-institutes"
  | "scholarships"
  | "applications"
  | "ut-credits"
  | "exam-prep"
  | "test-module"
  | "counselling"
  | "know-your-strengths"
  | "admission-help"
  | "referral"
  | "settings";

const VALID_SECTIONS: SectionId[] = [
  "dashboard",
  "profile",
  "exam-shortlist",
  "college-shortlist",
  "coaching-institutes",
  "scholarships",
  "applications",
  "ut-credits",
  "exam-prep",
  "test-module",
  "counselling",
  "know-your-strengths",
  "admission-help",
  "referral",
  "settings",
];

function parseSectionFromSearchParams(searchParams: URLSearchParams): SectionId {
  const section = searchParams.get("section");
  if (section && VALID_SECTIONS.includes(section as SectionId)) {
    return section as SectionId;
  }
  return "dashboard";
}

function DashboardPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeSection, setActiveSection] = useState<SectionId>(() =>
    parseSectionFromSearchParams(searchParams)
  );
  const [examPrepMode, setExamPrepMode] = useState<"self" | "coaching">("self");
  const [examSearchQuery, setExamSearchQuery] = useState("");
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [instituteSearchQuery, setInstituteSearchQuery] = useState("");
  const [scholarshipSearchQuery, setScholarshipSearchQuery] = useState("");

  useEffect(() => {
    if (activeSection !== "exam-shortlist") {
      setExamSearchQuery("");
    }
    if (activeSection !== "college-shortlist") {
      setCollegeSearchQuery("");
    }
    if (activeSection !== "coaching-institutes") {
      setInstituteSearchQuery("");
    }
    if (activeSection !== "scholarships") {
      setScholarshipSearchQuery("");
    }
  }, [activeSection]);

  useEffect(() => {
    setActiveSection(parseSectionFromSearchParams(searchParams));
    const mode = searchParams.get("mode");
    if (mode === "self" || mode === "coaching") {
      setExamPrepMode(mode);
    }
  }, [searchParams]);

  const navigateSection = useCallback(
    (id: SectionId, mode?: "self" | "coaching") => {
      setActiveSection(id);
      if (mode) setExamPrepMode(mode);

      const params = new URLSearchParams();
      if (id !== "dashboard") {
        params.set("section", id);
      }
      if (id === "exam-prep") {
        params.set("mode", mode ?? examPrepMode);
      }
      const query = params.toString();
      router.push(query ? `/dashboard?${query}` : "/dashboard", { scroll: false });
    },
    [router, examPrepMode]
  );

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const toggleSidebarCollapse = () => setSidebarCollapsed((v) => !v);

  const fullWidthSections: SectionId[] = [
    "profile",
    "exam-shortlist",
    "college-shortlist",
    "coaching-institutes",
    "scholarships",
    "applications",
    "ut-credits",
    "exam-prep",
    "test-module",
    "counselling",
    "know-your-strengths",
    "admission-help",
    "referral",
    "settings",
  ];

  return (
    <div className="h-screen flex bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Suspense fallback={null}>
        <StrengthPaymentReturnHandler
          onNavigateToStrengths={() => navigateSection("know-your-strengths")}
        />
      </Suspense>
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        activeSection={activeSection}
        onSectionChange={navigateSection}
        activeSubSection={examPrepMode}
        onSubSectionChange={(id) => navigateSection("exam-prep", id as "self" | "coaching")}
      />

      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={toggleSidebar}
          onToggleCollapse={toggleSidebarCollapse}
          isSidebarCollapsed={sidebarCollapsed}
          headerSlot={activeSection === "dashboard" ? <DashboardHeader /> : undefined}
          examShortlistToolbar={
            activeSection === "exam-shortlist"
              ? { searchValue: examSearchQuery, onSearchChange: setExamSearchQuery }
              : undefined
          }
          collegeShortlistToolbar={
            activeSection === "college-shortlist"
              ? { searchValue: collegeSearchQuery, onSearchChange: setCollegeSearchQuery }
              : undefined
          }
          instituteShortlistToolbar={
            activeSection === "coaching-institutes"
              ? { searchValue: instituteSearchQuery, onSearchChange: setInstituteSearchQuery }
              : undefined
          }
          scholarshipShortlistToolbar={
            activeSection === "scholarships"
              ? { searchValue: scholarshipSearchQuery, onSearchChange: setScholarshipSearchQuery }
              : undefined
          }
        />

        <div className="flex flex-1 overflow-hidden bg-[#F6F8FA] dark:bg-slate-950">
          {activeSection === "dashboard" ? (
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-2 md:px-6 md:pb-4 md:pt-2">
                <main className="min-w-0 flex-1 min-h-0 flex flex-col">
                  <MiddleContent />
                </main>
              </div>
            </div>
          ) : (
            <div
              className={[
                "flex flex-1 flex-col lg:flex-row lg:items-start overflow-x-hidden overflow-y-auto",
                fullWidthSections.includes(activeSection)
                  ? "px-0 py-0"
                  : "gap-4 px-4 py-4 md:px-6 md:py-4",
              ].join(" ")}
            >
              <main className="min-w-0 w-full max-w-full flex-1 overflow-x-hidden">
                {activeSection === "profile" && (
                  <div className="w-full">
                    <ProfileTabs />
                  </div>
                )}

                {activeSection === "exam-shortlist" && (
                  <ShortlistExams searchQuery={examSearchQuery} />
                )}

                {activeSection === "college-shortlist" && (
                  <ShortlistColleges searchQuery={collegeSearchQuery} />
                )}

                {activeSection === "coaching-institutes" && (
                  <ShortlistInstitutes searchQuery={instituteSearchQuery} />
                )}

                {activeSection === "scholarships" && (
                  <ShortlistScholarships searchQuery={scholarshipSearchQuery} />
                )}

                {activeSection === "applications" && <ApplicationsPage />}

                {activeSection === "ut-credits" && <UtCreditsWallet />}

                {activeSection === "exam-prep" && (
                  <ExamPreparation initialMode={examPrepMode} />
                )}

                {activeSection === "test-module" && <TestModule />}

                {activeSection === "counselling" && <Counselling />}

                {activeSection === "know-your-strengths" && (
                  <KnowYourStrengths
                    onSectionChange={(section) => navigateSection(section as SectionId)}
                  />
                )}

                {activeSection === "admission-help" && (
                  <AdmissionHelp
                    onSectionChange={(section) => navigateSection(section as SectionId)}
                  />
                )}

                {activeSection === "referral" && <ReferralCard />}

                {activeSection === "settings" && <Settings />}
              </main>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={null}>
      <DashboardPageContent />
    </Suspense>
  );
}