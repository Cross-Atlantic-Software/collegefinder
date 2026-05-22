"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardInstituteByRef } from "@/api/auth/profile";

export function instituteDetailKey(instituteRef: string) {
  return ["dashboard-institute-detail", instituteRef] as const;
}

export function useInstituteDetailQuery(instituteRef: string) {
  return useQuery({
    queryKey: instituteDetailKey(instituteRef),
    queryFn: async () => {
      const res = await getDashboardInstituteByRef(instituteRef);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load coaching institute");
      }
      return res.data;
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: Boolean(instituteRef?.trim()),
  });
}
