'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiX } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  listCreditOrders,
  listCreditTransactions,
  adjustWallet,
  refundFillCharge,
  type CreditOrderAdmin,
  type CreditTransactionAdmin,
} from '@/api/admin/credits';
import { canEdit } from '@/lib/adminPermissions';
import type { AdminUserType } from '@/api/types';

function useAdminRole(): AdminUserType | undefined {
  const [type, setType] = useState<AdminUserType | undefined>(undefined);
  useEffect(() => {
    try {
      const s = localStorage.getItem('admin_user');
      if (s) setType(JSON.parse(s)?.type);
    } catch { /* ignore */ }
  }, []);
  return type;
}

function formatDateTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}
const money = (n: number) => `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const humanize = (s: string) => s.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const ORDER_STATUS_STYLES: Record<string, string> = {
  paid: 'bg-emerald-50 text-emerald-700',
  created: 'bg-amber-50 text-amber-700',
  failed: 'bg-rose-50 text-rose-700',
};

function AdjustWalletModal({
  userId,
  userLabel,
  onClose,
  onDone,
}: {
  userId: number;
  userLabel: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [delta, setDelta] = useState<number>(0);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    if (!delta || Number.isNaN(delta)) { setErr('Enter a non-zero integer delta'); return; }
    setBusy(true);
    setErr(null);
    const res = await adjustWallet(userId, delta, note || undefined);
    setBusy(false);
    if (!res.success) { setErr(res.message || 'Adjustment failed'); return; }
    onDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <p className="text-sm font-semibold text-slate-900">Adjust wallet</p>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100" aria-label="Close"><FiX /></button>
        </div>
        <div className="space-y-3 px-5 py-4">
          <p className="text-xs text-slate-500">User: <span className="font-medium text-slate-700">{userLabel}</span> (#{userId})</p>
          {err && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{err}</p>}
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Delta (credits, +/-)</span>
            <input
              type="number"
              value={delta}
              onChange={(e) => setDelta(parseInt(e.target.value, 10) || 0)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-slate-600">Note (optional)</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
          <button onClick={onClose} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-[#FAD53C] hover:bg-slate-800 disabled:opacity-60">
            {busy ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

type Tab = 'orders' | 'transactions';

export default function AdminPaymentsLedgerPage() {
  const role = useAdminRole();
  const isSuperAdmin = role === 'super_admin';
  const editable = canEdit(role);

  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<CreditOrderAdmin[]>([]);
  const [txns, setTxns] = useState<CreditTransactionAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adjust, setAdjust] = useState<{ userId: number; label: string } | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    if (tab === 'orders') {
      const res = await listCreditOrders({ limit: 200 });
      if (!res.success || !res.data) setError(res.message || 'Failed to load orders');
      else setOrders(res.data);
    } else {
      const res = await listCreditTransactions({ limit: 200 });
      if (!res.success || !res.data) setError(res.message || 'Failed to load transactions');
      else setTxns(res.data);
    }
    setIsLoading(false);
  }, [tab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRefund = async (chargeId: number) => {
    if (!confirm('Refund this fill charge to the student? Only active charges can be refunded.')) return;
    const res = await refundFillCharge(chargeId);
    if (!res.success) { alert(res.message || 'Refund failed'); return; }
    await fetchData();
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-slate-900">Payments &amp; Ledger</h1>
            <p className="text-sm text-slate-500">Purchase reconciliation and the full credit ledger.</p>
          </div>

          <div className="mb-3 flex items-center gap-2">
            {(['orders', 'transactions'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition-colors ${
                  tab === t ? 'border-slate-900 bg-slate-900 text-[#FAD53C]' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t === 'orders' ? 'Orders' : 'Transactions'}
              </button>
            ))}
            <button onClick={fetchData} className="ml-auto rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Refresh</button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            {isLoading && <p className="p-6 text-center text-sm text-slate-500">Loading…</p>}
            {error && <p className="p-6 text-center text-sm text-rose-600">{error}</p>}

            {!isLoading && !error && tab === 'orders' && (
              orders.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-500">No orders yet.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">USER</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">INVOICE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREDITS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TOTAL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">DATE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {orders.map((o) => (
                      <tr key={o.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5">
                          <p className="text-sm font-medium text-slate-800">{o.user_name || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{o.user_email}</p>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{o.invoice_number || '—'}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600">{o.credits}</td>
                        <td className="px-4 py-2.5 text-sm text-slate-600">{money(o.total_amount)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${ORDER_STATUS_STYLES[o.status] || 'bg-slate-100 text-slate-500'}`}>
                            {o.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-sm text-slate-600">{formatDateTime(o.paid_at || o.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {!isLoading && !error && tab === 'transactions' && (
              txns.length === 0 ? (
                <p className="p-10 text-center text-sm text-slate-500">No transactions yet.</p>
              ) : (
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">USER</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">DELTA</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">BALANCE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">DATE</th>
                      {(isSuperAdmin || editable) && <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">ACTIONS</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {txns.map((t) => {
                      const isCredit = t.delta >= 0;
                      const isFillCharge = t.type === 'fill_debit' && t.ref_type === 'fill_charge' && t.ref_id != null;
                      return (
                        <tr key={t.id} className="hover:bg-slate-50">
                          <td className="px-4 py-2.5">
                            <p className="text-sm font-medium text-slate-800">{t.user_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{t.user_email}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            <p className="text-sm text-slate-700">{humanize(t.type)}</p>
                            {t.note && <p className="max-w-xs truncate text-xs text-slate-400">{t.note}</p>}
                          </td>
                          <td className={`px-4 py-2.5 text-sm font-semibold ${isCredit ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {isCredit ? '+' : ''}{t.delta}
                          </td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{t.balance_after}</td>
                          <td className="px-4 py-2.5 text-sm text-slate-600">{formatDateTime(t.created_at)}</td>
                          {(isSuperAdmin || editable) && (
                            <td className="px-4 py-2.5 text-right">
                              <div className="inline-flex gap-2">
                                {editable && isFillCharge && (
                                  <button
                                    onClick={() => handleRefund(t.ref_id as number)}
                                    className="rounded-lg border border-rose-200 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                  >
                                    Refund charge
                                  </button>
                                )}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => setAdjust({ userId: t.user_id, label: t.user_name || t.user_email || `User ${t.user_id}` })}
                                    className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Adjust
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )
            )}
          </div>
        </main>
      </div>

      {adjust && (
        <AdjustWalletModal
          userId={adjust.userId}
          userLabel={adjust.label}
          onClose={() => setAdjust(null)}
          onDone={fetchData}
        />
      )}
    </div>
  );
}
