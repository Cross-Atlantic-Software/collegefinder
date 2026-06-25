"use client";

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useDashboardAcademicsQuery,
  useProfileCompletionQuery,
} from "@/lib/dashboardSidebarQueries";

export default function DashboardHeader() {
  const { user } = useAuth();
  const { data: completion, isLoading: completionLoading } = useProfileCompletionQuery();
  const { data: academics, isLoading: academicsLoading } = useDashboardAcademicsQuery();

  const fullName = useMemo(() => {
    const name = user?.name?.trim();
    if (name) return name;
    return user?.email?.split("@")[0] || "User";
  }, [user]);

  const stream = useMemo(() => {
    const label = academics?.stream?.trim();
    if (label) return label;
    if (academicsLoading) return "…";
    return "Not set";
  }, [academics?.stream, academicsLoading]);

  const profileStrength = useMemo(() => {
    if (completionLoading) return null;
    return completion?.percentage ?? 0;
  }, [completion?.percentage, completionLoading]);

  const airRank = "—";

  return (
    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-base font-semibold leading-tight text-slate-900 dark:text-slate-100">
          Dashboard
        </p>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{fullName}</p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <StatChip label="AIR" value={airRank} />
        <StatChip label="Stream" value={stream} />
        <StatChip label="Profile" value={profileStrength === null ? "…" : `${profileStrength}%`} />
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="hidden min-w-[78px] rounded-lg bg-slate-50 px-2.5 py-1 text-left dark:bg-slate-800/80 sm:block">
      <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 max-w-[120px] truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
        {value}
      </p>
    </div>
  );
}