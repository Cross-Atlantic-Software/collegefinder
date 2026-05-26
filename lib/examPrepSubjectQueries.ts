"use client";

import { useQuery } from "@tanstack/react-query";
import { getSubjectsByStream } from "@/api/auth/profile";

export const EXAM_PREP_SUBJECTS_KEY = ["exam-prep-subjects"] as const;

export function useExamPrepSubjectsQuery(enabled = true) {
  return useQuery({
    queryKey: EXAM_PREP_SUBJECTS_KEY,
    queryFn: async () => {
      const res = await getSubjectsByStream();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load subjects");
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
