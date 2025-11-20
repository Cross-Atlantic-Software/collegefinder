"use client";

import { useState } from "react";
import { MiddleContent, RightSidebar, Sidebar, TopBar } from "@/components/dashboard";
import { BasicInfoForm } from "@/components/user";

type SectionId =
  | "dashboard"
  | "profile"
  | "exam-shortlist"
  | "applications"
  | "exam-prep";

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

  const toggleSidebar = () => setSidebarOpen((v) => !v);

  return (
    <div className="h-screen bg-blueGradient text-slate-50 flex">
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
          <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6 lg:flex-row overflow-y-auto">
            {/* MIDDLE BAR */}
            <main className="flex-1 space-y-4">
              {activeSection === "dashboard" && <MiddleContent />}

              {activeSection === "profile" && (
                <section className="rounded-md bg-white/5 p-4">
                  <BasicInfoForm />
                </section>
              )}

              {activeSection === "exam-shortlist" && (
                <div className="rounded-md bg-white/5 p-4 text-sm">
                  Exam Shortlist content goes here…
                </div>
              )}

              {activeSection === "applications" && (
                <div className="rounded-md bg-white/5 p-4 text-sm">
                  Applications content goes here…
                </div>
              )}

              {activeSection === "exam-prep" && (
                <div className="rounded-md bg-white/5 p-4 text-sm">
                  Exam Prep content goes here…
                </div>
              )}
            </main>

            {/* RIGHT SIDEBAR */}
            <aside className="w-full space-y-4 lg:w-80">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
