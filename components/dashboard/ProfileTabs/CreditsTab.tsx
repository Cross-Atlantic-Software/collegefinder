"use client";

import { useState } from "react";
import { LuCoins, LuReceipt, LuArrowUpRight, LuArrowDownRight, LuX } from "react-icons/lu";
import {
  useWalletQuery,
  usePacksQuery,
  useTransactionsQuery,
  useCreateOrderMutation,
  useVerifyOrderMutation,
  useReceiptQuery,
} from "@/lib/creditsQueries";
import type { CreditPack, CreditTransaction } from "@/api/credits";
import { loadRazorpay, type RazorpaySuccessResponse } from "@/lib/razorpay";

/* ── helpers ──────────────────────────────────────────────────────────── */

function rupees(n: number) {
  return `₹${Number(n).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function humanizeType(type: string) {
  return type.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function readAuthUser(): { name?: string; email?: string } {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("auth_user");
    if (!raw) return {};
    const u = JSON.parse(raw);
    return { name: u?.name ?? undefined, email: u?.email ?? undefined };
  } catch {
    return {};
  }
}

/* ── receipt modal ────────────────────────────────────────────────────── */

function ReceiptModal({ orderId, onClose }: { orderId: number; onClose: () => void }) {
  const { data, isLoading, isError, error } = useReceiptQuery(orderId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <LuReceipt className="text-slate-500" />
            <p className="text-sm font-semibold text-slate-900">Receipt</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <LuX />
          </button>
        </div>

        <div className="px-5 py-4">
          {isLoading && (
            <p className="py-8 text-center text-sm text-slate-500">Loading receipt…</p>
          )}
          {isError && (
            <p className="py-8 text-center text-sm text-rose-600">
              {(error as Error)?.message || "Couldn't load this receipt."}
            </p>
          )}
          {data && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Invoice</span>
                <span className="font-mono text-sm font-semibold text-slate-900">
                  {data.invoice_number}
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Date</span>
                <span className="text-sm text-slate-700">{formatDateTime(data.paid_at)}</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-500">Pack</span>
                <span className="text-sm text-slate-700">
                  {data.pack_name} · {data.credits} credits
                </span>
              </div>

              <div className="rounded-xl border border-slate-200">
                <div className="flex justify-between px-4 py-2 text-sm">
                  <span className="text-slate-500">Base</span>
                  <span className="text-slate-800">{rupees(data.base_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 px-4 py-2 text-sm">
                  <span className="text-slate-500">
                    GST ({data.gst_percent}% · {data.gst_mode})
                  </span>
                  <span className="text-slate-800">{rupees(data.gst_amount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 px-4 py-2 text-sm font-semibold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-slate-900">{rupees(data.total_amount)}</span>
                </div>
              </div>

              <div className="space-y-0.5 border-t border-slate-100 pt-3 text-[11px] text-slate-400">
                <p>{data.legal.legal_entity_name}</p>
                <p>GSTIN: {data.legal.gstin}</p>
                <p>HSN/SAC: {data.legal.hsn_sac}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── pack card ────────────────────────────────────────────────────────── */

function PackCard({
  pack,
  onBuy,
  busy,
}: {
  pack: CreditPack;
  onBuy: (pack: CreditPack) => void;
  busy: boolean;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-semibold text-slate-900">{pack.name}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-900">{pack.credits}</span>
        <span className="text-xs text-slate-500">credits</span>
      </p>
      <div className="mt-3">
        <p className="text-lg font-semibold text-slate-900">{rupees(pack.total)}</p>
        <p className="text-[11px] text-slate-500">
          incl. {rupees(pack.gst)} GST ({pack.gst_percent}% {pack.gst_mode})
        </p>
      </div>
      <button
        type="button"
        onClick={() => onBuy(pack)}
        disabled={busy}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-[#FAD53C] transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? "Opening…" : "Buy credits"}
      </button>
    </div>
  );
}

/* ── transaction row ──────────────────────────────────────────────────── */

function TransactionRow({
  txn,
  onReceipt,
}: {
  txn: CreditTransaction;
  onReceipt: (orderId: number) => void;
}) {
  const isCredit = txn.delta >= 0;
  const isPurchase = txn.type === "purchase";

  return (
    <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isCredit ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
        }`}
      >
        {isCredit ? <LuArrowDownRight /> : <LuArrowUpRight />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800">{humanizeType(txn.type)}</p>
        <p className="truncate text-xs text-slate-500">
          {formatDateTime(txn.created_at)}
          {txn.note ? ` · ${txn.note}` : ""}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${isCredit ? "text-emerald-600" : "text-rose-600"}`}>
          {isCredit ? "+" : ""}
          {txn.delta}
        </p>
        <p className="text-[11px] text-slate-400">bal {txn.balance_after}</p>
      </div>
      {isPurchase && txn.ref_type === "credit_order" && txn.ref_id != null && (
        <button
          type="button"
          onClick={() => onReceipt(txn.ref_id as number)}
          className="shrink-0 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 hover:bg-slate-50"
        >
          Receipt
        </button>
      )}
    </div>
  );
}

/* ── the tab ──────────────────────────────────────────────────────────── */

export default function CreditsTab() {
  const wallet = useWalletQuery();
  const packs = usePacksQuery();
  const txns = useTransactionsQuery({ limit: 50 });
  const createOrder = useCreateOrderMutation();
  const verifyOrder = useVerifyOrderMutation();

  const [receiptOrderId, setReceiptOrderId] = useState<number | null>(null);
  const [buyingPackId, setBuyingPackId] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "warn" | "err"; text: string } | null>(
    null
  );

  const handleBuy = async (pack: CreditPack) => {
    setNotice(null);
    setBuyingPackId(pack.id);
    try {
      const RazorpayCtor = await loadRazorpay();
      const order = await createOrder.mutateAsync(pack.id);
      const user = readAuthUser();

      const rzp = new RazorpayCtor({
        key: order.key_id,
        amount: order.amount_paise,
        currency: order.currency,
        name: "UniTracko",
        description: `${pack.name} · ${pack.credits} credits`,
        order_id: order.razorpay_order_id,
        prefill: { name: user.name, email: user.email },
        theme: { color: "#0f172a" },
        handler: async (resp: RazorpaySuccessResponse) => {
          try {
            const verified = await verifyOrder.mutateAsync({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
            });
            setNotice({
              tone: "ok",
              text: `Payment successful — ${verified.credits} credits added. New balance: ${verified.balance}.`,
            });
          } catch (err) {
            setNotice({
              tone: "warn",
              text:
                (err as Error)?.message ||
                "We couldn't confirm the payment yet. Your balance may update shortly.",
            });
          } finally {
            setBuyingPackId(null);
          }
        },
        modal: {
          ondismiss: () => {
            setBuyingPackId(null);
            setNotice({ tone: "warn", text: "Payment cancelled — no credits were added." });
          },
        },
      });
      rzp.open();
    } catch (err) {
      setBuyingPackId(null);
      setNotice({
        tone: "err",
        text: (err as Error)?.message || "Could not start the payment. Please try again.",
      });
    }
  };

  const noticeStyles =
    notice?.tone === "ok"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : notice?.tone === "warn"
        ? "bg-amber-50 text-amber-700 ring-amber-200"
        : "bg-rose-50 text-rose-700 ring-rose-200";

  return (
    <div className="space-y-6">
      <div>
        <p className="text-lg font-semibold text-slate-900">Credits</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Credits power one-click form filling. Buy a pack, then fill exam forms with the ExamFill
          assistant.
        </p>
      </div>

      {notice && (
        <div className={`rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${noticeStyles}`}>
          {notice.text}
        </div>
      )}

      {/* Balance */}
      <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-700 px-5 py-5 text-white">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <LuCoins className="text-2xl text-[#FAD53C]" />
        </span>
        <div>
          <p className="text-xs text-slate-300">Available balance</p>
          <p className="text-3xl font-bold">
            {wallet.isLoading ? "…" : (wallet.data?.balance ?? 0)}
            <span className="ml-1 text-sm font-medium text-slate-300">credits</span>
          </p>
        </div>
      </div>

      {/* Packs */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900">Buy credits</p>
        {packs.isLoading && (
          <p className="py-6 text-center text-sm text-slate-500">Loading packs…</p>
        )}
        {packs.isError && (
          <p className="py-6 text-center text-sm text-rose-600">
            {(packs.error as Error)?.message || "Couldn't load packs."}
          </p>
        )}
        {packs.data && packs.data.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">No packs available right now.</p>
        )}
        {packs.data && packs.data.length > 0 && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {packs.data.map((pack) => (
              <PackCard
                key={pack.id}
                pack={pack}
                onBuy={handleBuy}
                busy={buyingPackId === pack.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* Transactions */}
      <div>
        <p className="mb-3 text-sm font-semibold text-slate-900">Transaction history</p>
        {txns.isLoading && (
          <p className="py-6 text-center text-sm text-slate-500">Loading transactions…</p>
        )}
        {txns.isError && (
          <p className="py-6 text-center text-sm text-rose-600">
            {(txns.error as Error)?.message || "Couldn't load transactions."}
          </p>
        )}
        {txns.data && txns.data.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <LuCoins className="text-2xl text-slate-300" />
            <p className="text-sm font-medium text-slate-700">No transactions yet</p>
            <p className="max-w-xs text-xs text-slate-500">
              Your purchases, fill charges, and refunds will appear here.
            </p>
          </div>
        )}
        {txns.data && txns.data.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            {txns.data.map((txn) => (
              <TransactionRow key={txn.id} txn={txn} onReceipt={setReceiptOrderId} />
            ))}
          </div>
        )}
      </div>

      {receiptOrderId != null && (
        <ReceiptModal orderId={receiptOrderId} onClose={() => setReceiptOrderId(null)} />
      )}
    </div>
  );
}
