"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getExamById, getExamsCount, type Exam } from "@/api/exams";

export const EXAMS_COUNT_KEY = ["exams-count"] as const;

export function examDetailKey(idOrSlug: string) {
  return ["exam-detail", String(idOrSlug).trim()] as const;
}

export async function fetchExamDetail(idOrSlug: string): Promise<Exam> {
  const res = await getExamById(idOrSlug);
  if (!res.success || !res.data?.exam) {
    throw new Error(res.message || "Exam not found");
  }
  return res.data.exam;
}

export function useExamDetailQuery(idOrSlug: string, enabled = true) {
  const key = String(idOrSlug).trim();
  return useQuery({
    queryKey: examDetailKey(key),
    queryFn: () => fetchExamDetail(key),
    enabled: enabled && key.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
}

export function useExamsCountQuery(enabled = true) {
  return useQuery({
    queryKey: EXAMS_COUNT_KEY,
    queryFn: async () => {
      const res = await getExamsCount();
      if (!res.success || res.data == null) {
        throw new Error(res.message || "Failed to load exam count");
      }
      return res.data.count;
    },
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    enabled,
  });
}

/** Warm cache when hovering a card link (optional). */
export function usePrefetchExamDetail() {
  const qc = useQueryClient();
  return (idOrSlug: string) => {
    const key = String(idOrSlug).trim();
    if (!key) return;
    void qc.prefetchQuery({
      queryKey: examDetailKey(key),
      queryFn: () => fetchExamDetail(key),
      staleTime: 5 * 60_000,
    });
  };
}
