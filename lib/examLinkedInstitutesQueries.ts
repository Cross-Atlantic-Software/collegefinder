"use client";

import { useQuery } from "@tanstack/react-query";
import { getInstitutesForExam, type DashboardInstitute } from "@/api/auth/profile";

export function examLinkedInstitutesKey(examId: number) {
  return ["exam-linked-institutes", examId] as const;
}

export function useExamLinkedInstitutesQuery(examId: number | null | undefined) {
  const id = examId != null ? Number(examId) : NaN;
  const enabled = Number.isInteger(id) && id > 0;

  return useQuery({
    queryKey: examLinkedInstitutesKey(enabled ? id : 0),
    queryFn: async (): Promise<{ institutes: DashboardInstitute[]; totalCount: number }> => {
      const res = await getInstitutesForExam(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load coaching institutes for this exam");
      }
      return {
        institutes: res.data.institutes ?? [],
        totalCount: res.data.totalCount ?? 0,
      };
    },
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}
