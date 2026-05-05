'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiCheckCircle, FiRefreshCw } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllUserQueriesAdmin,
  resolveUserQueryAdmin,
  type AdminUserQuery,
} from '@/api';
import { useToast } from '@/components/shared';

export default function AdminQueriesPage() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();

  const [rows, setRows] = useState<AdminUserQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'open' | 'resolved'>('all');
  const [selected, setSelected] = useState<AdminUserQuery | null>(null);
  const [answer, setAnswer] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const res = await getAllUserQueriesAdmin();
      if (res.success && res.data?.queries) {
        setRows(res.data.queries);
      } else {
        showError(res.message || 'Failed to load queries');
      }
    } catch {
      showError('Failed to load queries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ok = localStorage.getItem('admin_authenticated');
    const token = localStorage.getItem('admin_token');
    if (!ok || !token) {
      router.replace('/admin/login');
      return;
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (status !== 'all' && row.status !== status) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.query_type.toLowerCase().includes(q) ||
        row.description.toLowerCase().includes(q)
      );
    });
  }, [rows, search, status]);

  const openCount = rows.filter((r) => r.status === 'open').length;
  const resolvedCount = rows.filter((r) => r.status === 'resolved').length;

  const startResolve = (row: AdminUserQuery) => {
    setSelected(row);
    setAnswer(row.admin_answer || '');
  };

  const submitResolve = async () => {
    if (!selected) return;
    const value = answer.trim();
    if (!value) {
      showError('Please add an answer before marking resolved');
      return;
    }

    try {
      setSaving(true);
      const res = await resolveUserQueryAdmin(selected.id, value);
      if (!res.success) {
        showError(res.message || 'Failed to resolve query');
        return;
      }
      showSuccess('Query marked resolved and email sent');
      setSelected(null);
      setAnswer('');
      await load();
    } catch {
      showError('Failed to resolve query');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Queries</h1>
              <p className="text-sm text-slate-600">
                Review user queries and send resolution answers by email.
              </p>
            </div>
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-[#F6F8FA]"
            >
              <FiRefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs text-slate-500">Total</p>
              <p className="text-lg font-semibold text-slate-900">{rows.length}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <p className="text-xs text-amber-700">Open</p>
              <p className="text-lg font-semibold text-amber-800">{openCount}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2">
              <p className="text-xs text-emerald-700">Resolved</p>
              <p className="text-lg font-semibold text-emerald-800">{resolvedCount}</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, query type, description..."
              className="min-w-[280px] flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-highlight-300 focus:ring-2"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'all' | 'open' | 'resolved')}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-highlight-300 focus:ring-2"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading queries...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-slate-200 bg-[#F6F8FA]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">USER</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">QUERY</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">CREATED</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-slate-700">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">
                          No queries found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((row) => (
                        <tr key={row.id} className="align-top hover:bg-[#F9FAFB]">
                          <td className="px-3 py-3 text-sm">
                            <p className="font-medium text-slate-900">{row.name}</p>
                            <p className="text-slate-600">{row.email}</p>
                            <p className="text-slate-500">{row.phone || 'No phone'}</p>
                          </td>
                          <td className="px-3 py-3 text-sm">
                            <p className="mb-1 font-medium text-slate-900">{row.query_type}</p>
                            <p className="line-clamp-3 text-slate-600">{row.description}</p>
                            {row.admin_answer ? (
                              <p className="mt-2 line-clamp-2 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                                Answer: {row.admin_answer}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-3 text-sm">
                            {row.status === 'resolved' ? (
                              <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">
                                Resolved
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                                Open
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {new Date(row.created_at).toLocaleString()}
                            {row.resolved_at ? (
                              <p className="mt-1 text-emerald-700">
                                Resolved: {new Date(row.resolved_at).toLocaleString()}
                              </p>
                            ) : null}
                          </td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              disabled={row.status === 'resolved'}
                              onClick={() => startResolve(row)}
                              className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <FiCheckCircle className="h-3.5 w-3.5" />
                              Resolve
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Resolve Query</h2>
            <p className="mt-1 text-sm text-slate-600">
              Reply to <span className="font-medium">{selected.email}</span>. This answer will be sent by email.
            </p>
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-900">{selected.query_type}</p>
              <p className="mt-1 whitespace-pre-wrap text-slate-700">{selected.description}</p>
            </div>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={6}
              placeholder="Write your answer..."
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-highlight-300 focus:ring-2"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setAnswer('');
                }}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitResolve}
                disabled={saving}
                className="rounded-lg bg-[#341050] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#341050]/90 disabled:opacity-60"
              >
                {saving ? 'Sending...' : 'Mark Resolved & Send Email'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
