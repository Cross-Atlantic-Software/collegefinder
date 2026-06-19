'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiChevronLeft, FiChevronRight, FiRefreshCw, FiSearch } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAdminCreditLedger, type AdminCreditLedgerTransaction } from '@/api/admin/credits';

const PAGE_SIZE = 10;

function formatType(type: AdminCreditLedgerTransaction['type']): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function signedAmount(type: AdminCreditLedgerTransaction['type'], amount: number): string {
  const prefix = type === 'deduction' ? '−' : '+';
  return `${prefix}${Number(amount).toLocaleString('en-IN')} credits`;
}

function typeBadgeClass(type: AdminCreditLedgerTransaction['type']): string {
  if (type === 'deduction') return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

export default function AdminLedgerPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<AdminCreditLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userIdInput, setUserIdInput] = useState('');
  const [appliedUserId, setAppliedUserId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const loadLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminCreditLedger({
        page,
        limit: PAGE_SIZE,
        user_id: appliedUserId || undefined,
      });
      if (!res.success) {
        setError(res.message || 'Failed to load ledger');
        setTransactions([]);
        return;
      }
      setTransactions(res.data ?? []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch {
      setError('Failed to load credit ledger');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [page, appliedUserId]);

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    const token = localStorage.getItem('admin_token');
    const adminUser = localStorage.getItem('admin_user');
    if (!ok || !token) {
      router.replace('/admin/login');
      return;
    }
    try {
      const admin = adminUser ? JSON.parse(adminUser) : null;
      if (admin?.type !== 'super_admin') {
        router.replace('/admin');
      }
    } catch {
      router.replace('/admin');
    }
  }, [router]);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setAppliedUserId(userIdInput.trim());
  };

  const handleClearFilter = () => {
    setUserIdInput('');
    setAppliedUserId('');
    setPage(1);
  };

  const totalPages = Math.max(pagination.totalPages, 1);
  const showingFrom = pagination.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const showingTo = Math.min(page * PAGE_SIZE, pagination.total);

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader
          title="UT Credits Ledger"
          subtitle="View all credit transactions. Filter by user ID to see a specific user's history."
        />
        <main className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
              <div>
                <label htmlFor="ledger-user-id" className="mb-1 block text-xs font-medium text-slate-600">
                  User ID
                </label>
                <input
                  id="ledger-user-id"
                  type="number"
                  min={1}
                  step={1}
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-40 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#341050] focus:ring-1 focus:ring-[#341050]"
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#341050] px-4 py-2 text-sm font-medium text-white hover:bg-[#2a0c40]"
              >
                <FiSearch className="h-4 w-4" />
                Search
              </button>
              {appliedUserId ? (
                <button
                  type="button"
                  onClick={handleClearFilter}
                  className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Clear filter
                </button>
              ) : null}
            </form>

            <button
              type="button"
              onClick={() => void loadLedger()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm hover:bg-[#F6F8FA] disabled:opacity-60"
            >
              <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {appliedUserId ? (
            <p className="mb-3 text-sm text-slate-600">
              Showing transactions for user ID <span className="font-semibold text-slate-900">{appliedUserId}</span>
            </p>
          ) : (
            <p className="mb-3 text-sm text-slate-600">Showing all transactions</p>
          )}

          {error ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm text-slate-500">
                <FiRefreshCw className="h-5 w-5 animate-spin" />
                Loading transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex min-h-[200px] items-center justify-center text-sm text-slate-500">
                No transactions found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      <th className="px-3 py-3">Txn ID</th>
                      <th className="px-3 py-3">User ID</th>
                      <th className="px-3 py-3">User</th>
                      <th className="px-3 py-3">Email</th>
                      <th className="px-3 py-3">Date</th>
                      <th className="px-3 py-3">Type</th>
                      <th className="px-3 py-3">Amount</th>
                      <th className="px-3 py-3">Balance After</th>
                      <th className="px-3 py-3">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50/80">
                        <td className="px-3 py-2.5 font-mono text-xs text-slate-600">{tx.id}</td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">{tx.user_id}</td>
                        <td className="px-3 py-2.5 text-slate-700">{tx.user_name || '—'}</td>
                        <td className="px-3 py-2.5 text-slate-600">{tx.user_email || '—'}</td>
                        <td className="px-3 py-2.5 whitespace-nowrap text-slate-600">
                          {new Date(tx.created_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeBadgeClass(tx.type)}`}
                          >
                            {formatType(tx.type)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 font-medium text-slate-800">
                          {signedAmount(tx.type, tx.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {Number(tx.balance_after).toLocaleString('en-IN')} credits
                        </td>
                        <td className="px-3 py-2.5 text-slate-600">{tx.description || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {pagination.total === 0
                ? '0 transactions'
                : `Showing ${showingFrom}–${showingTo} of ${pagination.total}`}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                <FiChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading || pagination.total === 0}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm disabled:opacity-50"
              >
                Next
                <FiChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
