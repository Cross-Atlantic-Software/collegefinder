"use client";

import { useMutation, useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import {
  getDashboardExamsMeta,
  getDashboardExamsTab,
  updateShortlistedExam,
  updateAlreadyFilledForm,
  type DashboardExamTabId,
} from "@/api/exams";

export const DASHBOARD_EXAM_META_KEY = ["dashboard-exams-meta"] as const;

export function dashboardExamTabKey(
  tab: DashboardExamTabId,
  page: number,
  limit: number,
  search: string
) {
  return ["dashboard-exams-tab", tab, page, limit, search] as const;
}

export async function fetchDashboardExamsTabData(
  tab: DashboardExamTabId,
  page: number,
  limit: number,
  search: string
) {
  const res = await getDashboardExamsTab(tab, { page, limit, search });
  if (!res.success || !res.data) {
    throw new Error(res.message || "Failed to load exams");
  }
  return res.data;
}

export function useDashboardExamsMetaQuery(enabled = true) {
  return useQuery({
    queryKey: DASHBOARD_EXAM_META_KEY,
    queryFn: async () => {
      const res = await getDashboardExamsMeta();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load exam shortlist meta");
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

export function useDashboardExamsTabQuery(opts: {
  tab: DashboardExamTabId;
  page: number;
  limit: number;
  search: string;
  enabled?: boolean;
}) {
  const { tab, page, limit, search, enabled = true } = opts;
  return useQuery({
    queryKey: dashboardExamTabKey(tab, page, limit, search),
    queryFn: () => fetchDashboardExamsTabData(tab, page, limit, search),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUpdateAlreadyFilledFormMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, filled }: { examId: number; filled: boolean }) =>
      updateAlreadyFilledForm(examId, filled),
    onSuccess: (res) => {
      if (!res.success || !res.data) return;
      qc.setQueryData(DASHBOARD_EXAM_META_KEY, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          alreadyFilledFormExamIds: res.data!.alreadyFilledFormExamIds,
          shortlistedExamIds: res.data!.shortlistedExamIds,
        };
      });
      void qc.invalidateQueries({ queryKey: ["dashboard-exams-tab"] });
      void qc.invalidateQueries({ queryKey: ["profile-academics-filled"] });
    },
  });
}

export function useUpdateShortlistedExamMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, shortlisted }: { examId: number; shortlisted: boolean }) =>
      updateShortlistedExam(examId, shortlisted),
    onSuccess: (res) => {
      if (!res.success || !res.data) return;
      qc.setQueryData(DASHBOARD_EXAM_META_KEY, (prev) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          shortlistedExamIds: res.data!.shortlistedExamIds,
        };
      });
      void qc.invalidateQueries({ queryKey: ["dashboard-exams-tab"], exact: false });
      void qc.invalidateQueries({ queryKey: ["exam-detail"], exact: false });
    },
  });
}
