"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getExamPrepLecturesBySubject,
  getExamPrepRecommendedLecture,
} from "@/api/auth/profile";

export function examPrepRecommendedKey(sort: "latest" | "popular") {
  return ["exam-prep-recommended", sort] as const;
}

export function examPrepSubjectKey(subjectId: string, search: string) {
  return ["exam-prep-subject", subjectId, search] as const;
}

export function useExamPrepRecommendedQuery(
  sort: "latest" | "popular",
  enabled = true
) {
  return useQuery({
    queryKey: examPrepRecommendedKey(sort),
    queryFn: async () => {
      const res = await getExamPrepRecommendedLecture(sort);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load recommended video");
      }
      return res.data;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled,
  });
}

export function useExamPrepLecturesBySubjectQuery(opts: {
  subjectId: string | null;
  search: string;
  enabled?: boolean;
}) {
  const { subjectId, search, enabled = true } = opts;
  return useQuery({
    queryKey: examPrepSubjectKey(subjectId ?? "", search),
    queryFn: async () => {
      if (!subjectId) {
        return { lectures: [], requiresStreamSelection: false, subjectId: 0 };
      }
      const res = await getExamPrepLecturesBySubject(subjectId, search);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load subject videos");
      }
      return res.data;
    },
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    retry: 2,
    refetchOnWindowFocus: false,
    enabled: enabled && !!subjectId,
  });
}
