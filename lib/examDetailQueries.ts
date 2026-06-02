"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { DashboardCollege } from "@/api/auth/profile";
import {
  getDashboardExamById,
  getExamById,
  getExamsCount,
  type Exam,
  type ExamLinkedScholarshipPreview,
  type ExamTaggedLecturePreview,
} from "@/api/exams";

export const EXAMS_COUNT_KEY = ["exams-count"] as const;

export type ExamDetailPageData = {
  exam: Exam;
  linkedColleges: DashboardCollege[];
  linkedCollegesTotal: number;
  linkedScholarships: ExamLinkedScholarshipPreview[];
  linkedScholarshipTotal: number;
  taggedLectureCount: number;
  taggedLecturePreviews: ExamTaggedLecturePreview[];
};

export function examDetailKey(idOrSlug: string) {
  return ["exam-detail", String(idOrSlug).trim()] as const;
}

function examEnrichmentScore(exam: Exam): number {
  let score = 0;
  if (exam.examDates) score += 2;
  if (exam.examPattern) score += 2;
  if (exam.eligibilityCriteria) score += 2;
  if (exam.examCutoff) score += 1;
  if ((exam.linkedPrograms?.length ?? 0) > 0) score += 1;
  if ((exam.linkedCareerGoals?.length ?? 0) > 0) score += 1;
  if (exam.description?.trim()) score += 1;
  if (exam.conducting_authority?.trim()) score += 1;
  return score;
}

/** Prefer the exam object with more enriched nested data. */
export function pickRicherExam(a: Exam | undefined, b: Exam | undefined): Exam | undefined {
  if (!a) return b;
  if (!b) return a;
  return examEnrichmentScore(b) > examEnrichmentScore(a) ? b : a;
}

type DashboardTabCache = {
  exams?: Exam[];
};

/** Enriched exam from dashboard tab query cache (when navigating from cards). */
export function findEnrichedExamInDashboardCache(
  qc: QueryClient,
  idOrSlug: string
): Exam | undefined {
  const raw = String(idOrSlug).trim();
  if (!raw) return undefined;

  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const entries = qc.getQueriesData<DashboardTabCache>({
    queryKey: ["dashboard-exams-tab"],
  });

  for (const [, data] of entries) {
    const exams = data?.exams;
    if (!exams?.length) continue;
    const hit = exams.find((e) => {
      if (String(e.id) === raw) return true;
      const code = e.code?.trim().toLowerCase();
      if (code && code === raw.toLowerCase()) return true;
      const nameSlug = (e.name || "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      return nameSlug === slug;
    });
    if (hit) return hit;
  }
  return undefined;
}

export async function fetchExamDetailPage(idOrSlug: string): Promise<ExamDetailPageData> {
  const key = String(idOrSlug).trim();

  const dashRes = await getDashboardExamById(key);
  if (dashRes.success && dashRes.data?.exam) {
    return {
      exam: dashRes.data.exam,
      linkedColleges: dashRes.data.linkedColleges ?? [],
      linkedCollegesTotal: dashRes.data.linkedCollegesTotal ?? 0,
      linkedScholarships: dashRes.data.linkedScholarships ?? [],
      linkedScholarshipTotal: dashRes.data.linkedScholarshipTotal ?? 0,
      taggedLectureCount: dashRes.data.taggedLectureCount ?? 0,
      taggedLecturePreviews: dashRes.data.taggedLecturePreviews ?? [],
    };
  }

  const pubRes = await getExamById(key);
  if (!pubRes.success || !pubRes.data?.exam) {
    throw new Error(dashRes.message || pubRes.message || "Exam not found");
  }
  return {
    exam: pubRes.data.exam,
    linkedColleges: [],
    linkedCollegesTotal: 0,
    linkedScholarships: [],
    linkedScholarshipTotal: 0,
    taggedLectureCount: 0,
    taggedLecturePreviews: [],
  };
}

export function useExamDetailQuery(idOrSlug: string, enabled = true) {
  const qc = useQueryClient();
  const key = String(idOrSlug).trim();

  return useQuery({
    queryKey: examDetailKey(key),
    queryFn: () => fetchExamDetailPage(key),
    enabled: enabled && key.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: true,
    placeholderData: () => {
      const cachedExam = findEnrichedExamInDashboardCache(qc, key);
      if (!cachedExam) return undefined;
      return {
        exam: cachedExam,
        linkedColleges: [],
        linkedCollegesTotal: 0,
        linkedScholarships: [],
        linkedScholarshipTotal: 0,
        taggedLectureCount: 0,
        taggedLecturePreviews: [],
      };
    },
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
      queryFn: () => fetchExamDetailPage(key),
      staleTime: 5 * 60_000,
    });
  };
}
