"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getDashboardScholarshipsMeta,
  getDashboardScholarshipsTab,
  updateShortlistedScholarship,
  type DashboardScholarshipTabId,
} from "@/api/auth/profile";

export const DASHBOARD_SCHOLARSHIP_META_KEY = ["dashboard-scholarships-meta"] as const;

export function dashboardScholarshipTabKey(
  tab: DashboardScholarshipTabId,
  page: number,
  limit: number,
  search: string
) {
  return ["dashboard-scholarships-tab", tab, page, limit, search] as const;
}

export async function fetchDashboardScholarshipsTabData(
  tab: DashboardScholarshipTabId,
  page: number,
  limit: number,
  search: string
) {
  const res = await getDashboardScholarshipsTab(tab, { page, limit, search });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load scholarships");
  }
  return res.data;
}

export function useDashboardScholarshipsMetaQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_SCHOLARSHIP_META_KEY,
    queryFn: async () => {
      const res = await getDashboardScholarshipsMeta();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load scholarships meta");
      }
      return res.data;
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
}

export function useDashboardScholarshipsTabQuery(opts: {
  tab: DashboardScholarshipTabId;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}) {
  const { tab, page, limit, search, enabled = true } = opts;
  return useQuery({
    queryKey: dashboardScholarshipTabKey(tab, page, limit, search),
    queryFn: () => fetchDashboardScholarshipsTabData(tab, page, limit, search),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpdateShortlistedScholarshipMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      scholarshipId,
      shortlisted,
    }: {
      scholarshipId: number;
      shortlisted: boolean;
    }) => updateShortlistedScholarship(scholarshipId, shortlisted),
    onSuccess: (res) => {
      if (!res.success || !res.data) return;
      qc.setQueryData(DASHBOARD_SCHOLARSHIP_META_KEY, (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          shortlistedScholarshipIds: res.data!.shortlistedScholarshipIds,
        };
      });
      void qc.invalidateQueries({ queryKey: ["dashboard-scholarships-tab"], exact: false });
      void qc.invalidateQueries({ queryKey: ["dashboard-scholarship-detail"], exact: false });
    },
  });
}
