"use client";

import { MiddleContent, RightSidebar, Sidebar, TopBar } from "@/components/dashboard";
import { useState } from "react";

export default function DashboardPage() {
  // closed by default (affects only mobile)
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(v => !v);

  return (
    <div className="h-screen bg-blueGradient text-slate-50 flex">
      <Sidebar sidebarOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex h-screen flex-1 flex-col">
        <TopBar onToggleSidebar={toggleSidebar} />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 flex-col gap-6 px-4 py-4 md:px-6 md:py-6 lg:flex-row overflow-y-auto">
            <main className="flex-1 space-y-4">
              <MiddleContent />
            </main>

            <aside className="w-full space-y-4 lg:w-80">
              <RightSidebar />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
