"use client";

import { useState } from "react";
import { ApplicationsPage, ExamPreparation, MiddleContent, RightSidebar, Sidebar, TopBar, TestModule } from "@/components/dashboard";
import { ShortlistExams, ShortlistColleges } from "@/components/dashboard";
import ProfileTabs from "@/components/dashboard/ProfileTabs/ProfileTabs";
import KnowYourStrengths from "@/components/dashboard/KnowYourStrengths";
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
  | "admission-help";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="h-screen flex bg-blueGradient text-slate-50">
      {/* LEFT SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={toggleSidebar}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {/* MAIN AREA */}
      <div className="flex h-screen flex-1 flex-col">
        <TopBar onToggleSidebar={toggleSidebar} />

        <div className="flex flex-1 overflow-hidden">
          <div
            className="
              flex flex-1 flex-col gap-6
              px-4 py-4 md:px-6 md:py-6
              lg:flex-row lg:items-start
              overflow-y-auto
            "
          >
            {/* MIDDLE BAR */}
            <main className="flex-1 min-w-0">
              {activeSection === "dashboard" && <MiddleContent />}

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
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="w-full space-y-4 lg:w-80 lg:flex-none">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
