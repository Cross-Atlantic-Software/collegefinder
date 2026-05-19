"use client";

import { useQuery } from "@tanstack/react-query";
import { getCollegesForExam, type DashboardCollege } from "@/api/auth/profile";

export function examLinkedCollegesKey(examId: number) {
  return ["exam-linked-colleges", examId] as const;
}

export function useExamLinkedCollegesQuery(examId: number | null | undefined) {
  const id = examId != null ? Number(examId) : NaN;
  const enabled = Number.isInteger(id) && id > 0;

  return useQuery({
    queryKey: examLinkedCollegesKey(enabled ? id : 0),
    queryFn: async (): Promise<{ colleges: DashboardCollege[]; totalCount: number }> => {
      const res = await getCollegesForExam(id);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load colleges for this exam");
      }
      return {
        colleges: res.data.colleges ?? [],
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
