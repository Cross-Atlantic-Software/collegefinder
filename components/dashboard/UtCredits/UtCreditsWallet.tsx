"use client";

import React, { useCallback, useEffect, useState } from "react";
import { MdRefresh } from "react-icons/md";
import { FiRefreshCw, FiCreditCard } from "react-icons/fi";
import { Button } from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCreditBalance,
  getCreditTransactions,
  purchaseCredits,
  type CreditTransaction,
} from "@/api/credits";

const PURCHASE_PRESETS = [50, 100, 200, 500];

function formatCredits(value: number): string {
  return `${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 2 })} credits`;
}

function formatTransactionType(type: CreditTransaction["type"]): string {
  switch (type) {
    case "purchase":
      return "Purchase";
    case "deduction":
      return "Deduction";
    case "refund":
      return "Refund";
    default:
      return type;
  }
}

function getTypeStyles(type: CreditTransaction["type"]): string {
  switch (type) {
    case "purchase":
    case "refund":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "deduction":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

function signedAmount(type: CreditTransaction["type"], amount: number): string {
  const prefix = type === "deduction" ? "−" : "+";
  return `${prefix}${formatCredits(amount)}`;
}

export default function UtCreditsWallet() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [purchaseAmount, setPurchaseAmount] = useState("100");
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadWallet = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [balanceRes, txRes] = await Promise.all([
        getCreditBalance(),
        getCreditTransactions({ page: 1, limit: 50 }),
      ]);

      if (!balanceRes.success) {
        throw new Error(balanceRes.message || "Failed to load balance");
      }
      if (!txRes.success) {
        throw new Error(txRes.message || "Failed to load transactions");
      }

      setBalance(balanceRes.data?.balance ?? 0);
      setTransactions(txRes.data ?? []);
    } catch (err) {
      console.error("Error loading UT Credits wallet:", err);
      setError(err instanceof Error ? err.message : "Failed to load wallet");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWallet();
  }, [loadWallet]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => setSuccess(null), 5000);
    return () => window.clearTimeout(timer);
  }, [success]);

  const handlePurchase = async (amountOverride?: number) => {
    const amount = amountOverride ?? Number(purchaseAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a valid credit amount greater than zero.");
      return;
    }

    setIsPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await purchaseCredits(amount);
      if (!response.success) {
        throw new Error(response.message || "Purchase failed");
      }
      setSuccess(`Successfully added ${formatCredits(amount)} to your wallet.`);
      await loadWallet();
    } catch (err) {
      console.error("Purchase error:", err);
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setIsPurchasing(false);
    }
  };

  const displayUserId = user?.id ?? transactions[0]?.user_id ?? "—";

  return (
    <div className="w-full min-h-screen bg-[#f5f9ff] text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <section className="w-full bg-[#f5f9ff]">
        <header className="border-b border-slate-200 bg-white px-4 pt-2 pb-0 dark:border-slate-800 dark:bg-slate-900 md:px-6">
          <div className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">
                UT Credits Wallet
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Purchase credits and view your transaction history for exam registrations.
              </p>
            </div>
            <button
              onClick={() => void loadWallet()}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 disabled:opacity-70 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <MdRefresh className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </header>

        <div className="bg-[#f8fbff] p-4 dark:bg-slate-950/40 md:p-6">
          <main className="mx-auto flex max-w-5xl flex-col gap-5">
            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
                {success}
              </div>
            ) : null}

            <div className="grid gap-4 md:grid-cols-[1.2fr_1fr]">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Available Balance
                    </p>
                    <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-slate-100">
                      {isLoading ? "…" : formatCredits(balance)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      User ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{displayUserId}</span>
                    </p>
                  </div>
                  <div className="rounded-full bg-[#FAD53C]/20 p-3 text-[#b88900]">
                    <FiCreditCard className="h-6 w-6" />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Purchase Credits</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Demo purchase flow — credits are added instantly to your wallet.
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {PURCHASE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setPurchaseAmount(String(preset))}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        purchaseAmount === String(preset)
                          ? "border-black bg-black text-[#FAD53C]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="number"
                    min={1}
                    step={1}
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-[#FAD53C] focus:border-slate-300 focus:ring-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Enter credits"
                  />
                  <Button
                    variant="themeButton"
                    size="sm"
                    disabled={isPurchasing}
                    className="shrink-0 rounded-full !border-black !bg-black !px-5 !text-[#FAD53C] hover:!bg-black/90"
                    onClick={() => void handlePurchase()}
                  >
                    {isPurchasing ? "Processing…" : "Purchase"}
                  </Button>
                </div>
              </div>
            </div>

            <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Transaction History</p>
              </div>

              {isLoading ? (
                <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 p-6 text-sm text-slate-500 dark:text-slate-400">
                  <FiRefreshCw className="h-5 w-5 animate-spin" />
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex min-h-[160px] items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400">
                  No transactions yet. Purchase credits to get started.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-[900px] w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-400">
                        <th className="px-3 py-3">User ID</th>
                        <th className="px-3 py-3">Date</th>
                        <th className="px-3 py-3">Type</th>
                        <th className="px-3 py-3">Amount</th>
                        <th className="px-3 py-3">Balance After</th>
                        <th className="px-3 py-3">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="px-3 py-3 font-medium text-slate-700 dark:text-slate-300">{tx.user_id}</td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                            {new Date(tx.created_at).toLocaleString()}
                          </td>
                          <td className="px-3 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getTypeStyles(tx.type)}`}
                            >
                              {formatTransactionType(tx.type)}
                            </span>
                          </td>
                          <td className="px-3 py-3 font-medium text-slate-800 dark:text-slate-200">
                            {signedAmount(tx.type, tx.amount)}
                          </td>
                          <td className="px-3 py-3 text-slate-700 dark:text-slate-300">
                            {formatCredits(tx.balance_after)}
                          </td>
                          <td className="px-3 py-3 text-slate-600 dark:text-slate-400">
                            {tx.description || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </main>
        </div>
      </section>
    </div>
  );
}
