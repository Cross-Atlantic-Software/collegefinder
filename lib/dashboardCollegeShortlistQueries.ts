"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getDashboardCollegesMeta,
  getDashboardCollegesTab,
  updateShortlistedCollege,
  type DashboardCollegeTabId,
} from "@/api/auth/profile";

export const DASHBOARD_COLLEGE_META_KEY = ["dashboard-colleges-meta"] as const;

export function dashboardCollegeTabKey(
  tab: DashboardCollegeTabId,
  page: number,
  limit: number,
  search: string
) {
  return ["dashboard-colleges-tab", tab, page, limit, search] as const;
}

export async function fetchDashboardCollegesTabData(
  tab: DashboardCollegeTabId,
  page: number,
  limit: number,
  search: string
) {
  const res = await getDashboardCollegesTab(tab, { page, limit, search });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load colleges");
  }
  return res.data;
}

export function useDashboardCollegesMetaQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_COLLEGE_META_KEY,
    queryFn: async () => {
      const res = await getDashboardCollegesMeta();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load college shortlist meta");
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

export function useDashboardCollegesTabQuery(opts: {
  tab: DashboardCollegeTabId;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}) {
  const { tab, page, limit, search, enabled = true } = opts;
  return useQuery({
    queryKey: dashboardCollegeTabKey(tab, page, limit, search),
    queryFn: () => fetchDashboardCollegesTabData(tab, page, limit, search),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpdateShortlistedCollegeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      collegeId,
      shortlisted,
    }: {
      collegeId: number;
      shortlisted: boolean;
    }) => updateShortlistedCollege(collegeId, shortlisted),
    onSuccess: (res) => {
      if (!res.success || !res.data) return;
      qc.setQueryData(DASHBOARD_COLLEGE_META_KEY, (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          shortlistedCollegeIds: res.data!.shortlistedCollegeIds,
        };
      });
      void qc.invalidateQueries({ queryKey: ["dashboard-colleges-tab"], exact: false });
      void qc.invalidateQueries({ queryKey: ["dashboard-college-detail"], exact: false });
    },
  });
}
