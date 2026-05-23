"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardScholarshipByRef } from "@/api/auth/profile";

export function scholarshipDetailKey(scholarshipRef: string) {
  return ["dashboard-scholarship-detail", scholarshipRef] as const;
}

export function useScholarshipDetailQuery(scholarshipRef: string) {
  return useQuery({
    queryKey: scholarshipDetailKey(scholarshipRef),
    queryFn: async () => {
      const res = await getDashboardScholarshipByRef(scholarshipRef);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load scholarship");
      }
      return res.data;
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: Boolean(scholarshipRef?.trim()),
  });
}
