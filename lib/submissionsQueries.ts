"use client";

import { useQuery } from "@tanstack/react-query";
import { getFillReports, getFillReportDetail } from "@/api/submissions";

/**
 * TanStack Query hooks for the student's submissions (audit trail).
 * Mirrors the project's lib/*Queries.ts convention: a query-key, a fetch that
 * unwraps ApiResponse and throws on failure, and a typed useQuery wrapper.
 */

export const SUBMISSIONS_KEY = ["submissions"] as const;
export const submissionDetailKey = (id: number) => ["submission", id] as const;

export function useSubmissionsQuery(enabled = true) {
  return useQuery({
    queryKey: SUBMISSIONS_KEY,
    queryFn: async () => {
      const res = await getFillReports();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load submissions");
      }
      return res.data;
    },
    enabled,
  });
}

/** Pass null to keep the query idle (e.g. when no row is expanded). */
export function useSubmissionDetailQuery(id: number | null) {
  return useQuery({
    queryKey: submissionDetailKey(id ?? -1),
    queryFn: async () => {
      const res = await getFillReportDetail(id as number);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load this submission");
      }
      return res.data;
    },
    enabled: id != null,
  });
}
