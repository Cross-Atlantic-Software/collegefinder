"use client";

import { useState, type ReactNode } from "react";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export type DashboardSectionId =
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
  | "referral";

type DashboardPageShellProps = {
  activeSection: DashboardSectionId;
  onSectionChange: (id: DashboardSectionId) => void;
  activeSubSection?: string;
  onSubSectionChange?: (id: string) => void;
  children: ReactNode;
};

/** Single Sidebar + TopBar mount for dashboard sub-pages (avoids duplicate sidebar API calls on loading transitions). */
export default function DashboardPageShell({
  activeSection,
  onSectionChange,
  activeSubSection,
  onSubSectionChange,
  children,
}: DashboardPageShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="flex h-screen bg-[#F6F8FA] dark:bg-slate-950 text-slate-900 dark:text-slate-50">
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection={activeSection}
        onSectionChange={onSectionChange}
        activeSubSection={activeSubSection}
        onSubSectionChange={onSubSectionChange}
      />
      <div className="flex h-screen flex-1 flex-col bg-[#F6F8FA] dark:bg-slate-950">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />
        <div className="flex-1 overflow-y-auto bg-[#F6F8FA] dark:bg-slate-950">{children}</div>
      </div>
    </div>
  );
}
