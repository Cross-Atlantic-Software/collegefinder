"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardCollegeByRef } from "@/api/auth/profile";

export function collegeDetailKey(collegeRef: string) {
  return ["dashboard-college-detail", collegeRef] as const;
}

export function useCollegeDetailQuery(collegeRef: string) {
  return useQuery({
    queryKey: collegeDetailKey(collegeRef),
    queryFn: async () => {
      const res = await getDashboardCollegeByRef(collegeRef);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load college");
      }
      return res.data;
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: Boolean(collegeRef?.trim()),
  });
}
