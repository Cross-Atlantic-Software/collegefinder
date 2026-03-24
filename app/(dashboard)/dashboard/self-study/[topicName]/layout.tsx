"use client";

import { useState } from "react";
import { Sidebar, TopBar } from "@/components/dashboard";

export default function SelfStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  return (
    <div className="h-screen flex bg-blueGradient text-slate-50">
      {/* LEFT SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        activeSection="exam-prep"
        onSectionChange={() => {}}
      />

      {/* MAIN AREA */}
      <div className="flex h-screen flex-1 flex-col">
        <TopBar
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
          onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
          isSidebarCollapsed={sidebarCollapsed}
        />

        <div className="flex flex-1 overflow-hidden">
          <div
            className="
              flex flex-1 flex-col gap-4
              px-4 py-3 md:px-5 md:py-4
              lg:flex-row lg:items-start
              overflow-y-auto
            "
          >
            {/* MIDDLE BAR */}
            <main className="flex-1 min-w-0">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

