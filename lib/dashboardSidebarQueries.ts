"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfileCompletion, getDashboardColleges } from "@/api";
import { getDashboardInstitutes, getDashboardScholarships } from "@/api/auth/profile";

export const PROFILE_COMPLETION_KEY = ["profile-completion"] as const;
export const DASHBOARD_COLLEGES_KEY = ["dashboard-colleges"] as const;
export const DASHBOARD_INSTITUTES_KEY = ["dashboard-institutes"] as const;
export const DASHBOARD_SCHOLARSHIPS_KEY = ["dashboard-scholarships"] as const;

const sidebarQueryDefaults = {
  staleTime: 120_000,
  gcTime: 10 * 60_000,
  retry: 2,
  refetchOnWindowFocus: false,
} as const;

export function useProfileCompletionQuery() {
  return useQuery({
    queryKey: PROFILE_COMPLETION_KEY,
    queryFn: async () => {
      const res = await getProfileCompletion();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load profile completion");
      }
      return res.data;
    },
    ...sidebarQueryDefaults,
  });
}

export function useDashboardCollegesQuery() {
  return useQuery({
    queryKey: DASHBOARD_COLLEGES_KEY,
    queryFn: async () => {
      const res = await getDashboardColleges();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load colleges");
      }
      return res.data;
    },
    ...sidebarQueryDefaults,
  });
}

export function useDashboardInstitutesQuery() {
  return useQuery({
    queryKey: DASHBOARD_INSTITUTES_KEY,
    queryFn: async () => {
      const res = await getDashboardInstitutes();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load institutes");
      }
      return res.data;
    },
    ...sidebarQueryDefaults,
  });
}

export function useDashboardScholarshipsQuery() {
  return useQuery({
    queryKey: DASHBOARD_SCHOLARSHIPS_KEY,
    queryFn: async () => {
      const res = await getDashboardScholarships();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load scholarships");
      }
      return res.data;
    },
    ...sidebarQueryDefaults,
  });
}
