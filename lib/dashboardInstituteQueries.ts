"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getDashboardInstitutesMeta,
  getDashboardInstitutesTab,
  updateShortlistedInstitute,
  type DashboardInstituteDelivery,
} from "@/api/auth/profile";

export const DASHBOARD_INSTITUTE_META_KEY = ["dashboard-institutes-meta"] as const;

export function dashboardInstituteTabKey(
  delivery: DashboardInstituteDelivery,
  page: number,
  limit: number,
  search: string
) {
  return ["dashboard-institutes-tab", delivery, page, limit, search] as const;
}

export async function fetchDashboardInstitutesTabData(
  delivery: DashboardInstituteDelivery,
  page: number,
  limit: number,
  search: string
) {
  const res = await getDashboardInstitutesTab(delivery, { page, limit, search });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load coaching institutes");
  }
  return res.data;
}

export function useDashboardInstitutesMetaQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_INSTITUTE_META_KEY,
    queryFn: async () => {
      const res = await getDashboardInstitutesMeta();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load coaching institutes meta");
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

export function useDashboardInstitutesTabQuery(opts: {
  delivery: DashboardInstituteDelivery;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}) {
  const { delivery, page, limit, search, enabled = true } = opts;
  return useQuery({
    queryKey: dashboardInstituteTabKey(delivery, page, limit, search),
    queryFn: () => fetchDashboardInstitutesTabData(delivery, page, limit, search),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpdateShortlistedInstituteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      instituteId,
      shortlisted,
    }: {
      instituteId: number;
      shortlisted: boolean;
    }) => updateShortlistedInstitute(instituteId, shortlisted),
    onSuccess: (res) => {
      if (!res.success || !res.data) return;
      qc.setQueryData(DASHBOARD_INSTITUTE_META_KEY, (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          shortlistedInstituteIds: res.data!.shortlistedInstituteIds,
        };
      });
      void qc.invalidateQueries({ queryKey: ["dashboard-institutes-tab"], exact: false });
      void qc.invalidateQueries({ queryKey: ["dashboard-institute-detail"], exact: false });
    },
  });
}
