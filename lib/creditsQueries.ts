"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getWallet,
  getPacks,
  getTransactions,
  createOrder,
  verifyOrder,
  getReceipt,
  type TransactionsQuery,
  type VerifyOrderPayload,
} from "@/api/credits";

/**
 * TanStack Query hooks for the student's credits wallet, packs, and ledger.
 * Mirrors lib/submissionsQueries.ts: a query-key, a fetch that unwraps
 * ApiResponse and throws on failure, and a typed useQuery/useMutation wrapper.
 */

export const WALLET_KEY = ["credits", "wallet"] as const;
export const PACKS_KEY = ["credits", "packs"] as const;
export const transactionsKey = (q: TransactionsQuery = {}) =>
  ["credits", "transactions", q.limit ?? null, q.offset ?? null, q.type ?? null] as const;
export const receiptKey = (orderId: number) => ["credits", "receipt", orderId] as const;

export function useWalletQuery(enabled = true) {
  return useQuery({
    queryKey: WALLET_KEY,
    queryFn: async () => {
      const res = await getWallet();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load your wallet");
      }
      return res.data;
    },
    enabled,
  });
}

export function usePacksQuery(enabled = true) {
  return useQuery({
    queryKey: PACKS_KEY,
    queryFn: async () => {
      const res = await getPacks();
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load credit packs");
      }
      return res.data;
    },
    enabled,
  });
}

export function useTransactionsQuery(query: TransactionsQuery = {}, enabled = true) {
  return useQuery({
    queryKey: transactionsKey(query),
    queryFn: async () => {
      const res = await getTransactions(query);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load your transactions");
      }
      return res.data;
    },
    enabled,
  });
}

/** Pass null to keep the query idle (e.g. when no receipt is open). */
export function useReceiptQuery(orderId: number | null) {
  return useQuery({
    queryKey: receiptKey(orderId ?? -1),
    queryFn: async () => {
      const res = await getReceipt(orderId as number);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Failed to load this receipt");
      }
      return res.data;
    },
    enabled: orderId != null,
  });
}

/** Refresh wallet + ledger after a successful purchase. */
export function useInvalidateCredits() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: WALLET_KEY });
    qc.invalidateQueries({ queryKey: ["credits", "transactions"] });
  };
}

export function useCreateOrderMutation() {
  return useMutation({
    mutationFn: async (packId: number) => {
      const res = await createOrder(packId);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Could not start the payment");
      }
      return res.data;
    },
  });
}

export function useVerifyOrderMutation() {
  const invalidate = useInvalidateCredits();
  return useMutation({
    mutationFn: async (payload: VerifyOrderPayload) => {
      const res = await verifyOrder(payload);
      if (!res.success || !res.data) {
        throw new Error(res.message || "Payment verification failed");
      }
      return res.data;
    },
    onSuccess: () => invalidate(),
  });
}
