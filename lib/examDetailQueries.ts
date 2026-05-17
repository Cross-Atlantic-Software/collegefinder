"use client";

import { useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  getDashboardExamById,
  getExamById,
  getExamsCount,
  type Exam,
} from "@/api/exams";
import { examHasEnrichedDetails, normalizeEnrichedExam } from "@/lib/examDisplay";

export const EXAMS_COUNT_KEY = ["exams-count"] as const;

export function examDetailKey(idOrSlug: string) {
  return ["exam-detail", String(idOrSlug).trim()] as const;
}

function extractExamFromResponse(res: {
  success?: boolean;
  data?: { exam?: unknown } & Record<string, unknown>;
  exam?: unknown;
}): Exam | null {
  if (!res.success) return null;

  const data = res.data;
  if (data?.exam) {
    return normalizeEnrichedExam({
      ...data,
      exam: data.exam,
      linkedColleges: data.linkedColleges ?? data.linked_colleges,
    });
  }
  if (data && typeof data === "object" && "id" in data && "name" in data) {
    return normalizeEnrichedExam(data);
  }
  if (res.exam) {
    return normalizeEnrichedExam(res.exam);
  }
  return null;
}

/** Reuse enriched exam from shortlist tab cache when navigating from a card. */
export function findExamInDashboardCaches(
  qc: QueryClient,
  idOrSlug: string
): Exam | null {
  const key = String(idOrSlug).trim().toLowerCase();
  const idNum = parseInt(key, 10);

  const queries = qc.getQueriesData<{ exams?: Exam[] }>({
    queryKey: ["dashboard-exams-tab"],
  });

  for (const [, data] of queries) {
    const exams = data?.exams;
    if (!exams?.length) continue;
    const hit = exams.find((e) => {
      if (Number.isInteger(idNum) && idNum > 0 && Number(e.id) === idNum) return true;
      if (String(e.id) === key) return true;
      if (e.code?.trim().toLowerCase() === key) return true;
      if (e.name?.trim().toLowerCase() === key) return true;
      return false;
    });
    if (hit && examHasEnrichedDetails(hit)) return hit;
  }

  return null;
}

export async function fetchExamDetail(
  idOrSlug: string,
  qc?: QueryClient
): Promise<Exam> {
  const trimmed = String(idOrSlug).trim();
  if (!trimmed) {
    throw new Error("Exam not found");
  }

  const hasAuth =
    typeof window !== "undefined" && Boolean(localStorage.getItem("auth_token")?.trim());

  if (hasAuth) {
    try {
      const authRes = await getDashboardExamById(trimmed);
      const authExam = extractExamFromResponse(authRes);
      if (authExam) return authExam;
    } catch {
      /* fall through */
    }
  }

  if (qc) {
    const cached = findExamInDashboardCaches(qc, trimmed);
    if (cached) {
      try {
        const res = await getExamById(trimmed);
        const full = extractExamFromResponse(res);
        if (full?.linkedColleges?.length) {
          return { ...cached, linkedColleges: full.linkedColleges };
        }
      } catch {
        /* keep cached exam without colleges */
      }
      return cached;
    }
  }

  const res = await getExamById(trimmed);
  const exam = extractExamFromResponse(res);
  if (!exam) {
    throw new Error(res.message || "Exam not found");
  }
  return exam;
}

export function useExamDetailQuery(idOrSlug: string, enabled = true) {
  const qc = useQueryClient();
  const key = String(idOrSlug).trim();
  return useQuery({
    queryKey: examDetailKey(key),
    queryFn: () => fetchExamDetail(key, qc),
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
      queryFn: () => fetchExamDetail(key, qc),
      staleTime: 5 * 60_000,
    });
  };
}
