"use client";

import { useQuery } from "@tanstack/react-query";
import { getStrengthPaymentStatus, getStrengthResults } from "@/api/strength";

export const STRENGTH_PAYMENT_STATUS_KEY = ["strength-payment-status"] as const;
export const STRENGTH_RESULTS_KEY = ["strength-results"] as const;

export function useStrengthPaymentStatusQuery(enabled = true) {
  return useQuery({
    queryKey: STRENGTH_PAYMENT_STATUS_KEY,
    queryFn: async () => {
      const res = await getStrengthPaymentStatus();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load strength payment status");
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

export function useStrengthResultsQuery(enabled = true) {
  return useQuery({
    queryKey: STRENGTH_RESULTS_KEY,
    queryFn: async () => {
      const res = await getStrengthResults();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load strength results");
      }
      return res.data;
    },
    staleTime: 120_000,
    gcTime: 10 * 60_000,
    retry: false,
    refetchOnWindowFocus: false,
    enabled,
  });
}

/** Strengths panel on Exam Prep — skips results API unless user has paid. */
export function useExamPrepStrengthsQuery(enabled = true) {
  const paymentQuery = useStrengthPaymentStatusQuery(enabled);
  const isPaid = paymentQuery.data?.payment_status === "paid";
  const resultsQuery = useStrengthResultsQuery(enabled && isPaid && !paymentQuery.isLoading);

  const strengths =
    isPaid && resultsQuery.data?.has_results && resultsQuery.data.results?.strengths
      ? resultsQuery.data.results.strengths
      : null;

  const loading =
    paymentQuery.isLoading || (isPaid && resultsQuery.isLoading && !resultsQuery.isFetched);

  return { strengths, loading };
}
