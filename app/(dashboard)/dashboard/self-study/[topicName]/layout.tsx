"use client";

import { useState } from "react";
import { Sidebar, TopBar, RightSidebar } from "@/components/dashboard";

export default function SelfStudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex bg-blueGradient text-slate-50">
      {/* LEFT SIDEBAR */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        onToggle={() => setSidebarOpen((v) => !v)}
        activeSection="exam-prep"
        onSectionChange={() => {}}
      />

      {/* MAIN AREA */}
      <div className="flex h-screen flex-1 flex-col">
        <TopBar onToggleSidebar={() => setSidebarOpen((v) => !v)} />

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
              {children}
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

