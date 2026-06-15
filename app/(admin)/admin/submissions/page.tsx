'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiFileText, FiUser, FiCheckCircle, FiEdit2, FiX, FiSearch } from 'react-icons/fi';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getApiBaseUrl } from '@/api/client';

/* ── types (inline, matching the applications-page convention) ─────────── */

interface AdminReport {
    id: number;
    user_id: number;
    user_name: string | null;
    user_email: string | null;
    exam_id: string;
    section_name: string;
    total_fields: number;
    filled_count: number;
    failed_count: number;
    confirmed_at: string | null;
    has_changes: boolean;
    created_at: string;
}

type FillStatus = 'filled' | 'check' | 'failed' | 'not_found' | 'skipped';

interface FieldResult {
    field_id: string;
    label: string;
    status: FillStatus;
    value: string | null;
    note: string | null;
}

interface ReportChange {
    from: string;
    to: string;
}

interface AdminReportDetail extends AdminReport {
    user_phone: string | null;
    field_results: FieldResult[];
    student_changes: Record<string, ReportChange> | null;
}

/* ── helpers ───────────────────────────────────────────────────────────── */

function humanizeExam(id: string) {
    return id.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function humanizePath(path: string) {
    return path.split('.').slice(-2).join(' ').replace(/[_.]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDateTime(iso: string | null) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString(undefined, {
        day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit',
    });
}

const STATUS_STYLES: Record<FillStatus, string> = {
    filled: 'bg-emerald-50 text-emerald-700',
    check: 'bg-amber-50 text-amber-700',
    failed: 'bg-rose-50 text-rose-700',
    not_found: 'bg-rose-50 text-rose-700',
    skipped: 'bg-slate-100 text-slate-500',
};

/* ── detail modal ──────────────────────────────────────────────────────── */

function DetailModal({ id, onClose }: { id: number; onClose: () => void }) {
    const [detail, setDetail] = useState<AdminReportDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        (async () => {
            try {
                const token = localStorage.getItem('admin_token') || '';
                const res = await fetch(`${getApiBaseUrl()}/admin/fill-reports/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const json = await res.json();
                if (!json.success) throw new Error(json.message || 'Failed to load');
                setDetail(json.data);
            } catch (e) {
                setError((e as Error).message);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const changes = detail?.student_changes ? Object.entries(detail.student_changes) : [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <h2 className="text-sm font-semibold text-slate-900">Submission detail</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <FiX />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-4 space-y-4">
                    {loading && <p className="text-sm text-slate-500">Loading…</p>}
                    {error && <p className="text-sm text-rose-600">{error}</p>}

                    {detail && (
                        <>
                            <div className="rounded-lg bg-[#F6F8FA] px-3 py-2 text-sm">
                                <p className="font-medium text-slate-800">
                                    {detail.user_name || 'Unknown'}{' '}
                                    <span className="font-normal text-slate-500">{detail.user_email}</span>
                                </p>
                                <p className="text-slate-500">
                                    {humanizeExam(detail.exam_id)} · {detail.section_name} · {formatDateTime(detail.created_at)}
                                </p>
                            </div>

                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Information submitted
                                </p>
                                <div className="overflow-hidden rounded-lg border border-slate-200">
                                    {detail.field_results.map((f, i) => (
                                        <div key={f.field_id + i} className="flex items-center justify-between gap-3 border-b border-slate-100 px-3 py-2 last:border-b-0">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-medium text-slate-800">{f.label}</p>
                                                <p className="truncate text-sm text-slate-500">{f.value || '—'}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[f.status]}`}>
                                                {f.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {changes.length > 0 && (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Changes made by the student
                                    </p>
                                    <div className="overflow-hidden rounded-lg border border-slate-200">
                                        {changes.map(([path, c]) => (
                                            <div key={path} className="border-b border-slate-100 px-3 py-2 last:border-b-0">
                                                <p className="text-sm font-medium text-slate-800">{humanizePath(path)}</p>
                                                <p className="mt-0.5 text-sm">
                                                    <span className="text-rose-500 line-through">{c.from || '(empty)'}</span>
                                                    <span className="mx-1.5 text-slate-400">→</span>
                                                    <span className="text-emerald-600">{c.to || '(empty)'}</span>
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <p className="text-xs text-slate-500">
                                {detail.confirmed_at
                                    ? <>Reviewed and confirmed on <span className="font-medium text-slate-700">{formatDateTime(detail.confirmed_at)}</span>.</>
                                    : <>Filled without student review.</>}
                            </p>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ── page ──────────────────────────────────────────────────────────────── */

export default function AdminSubmissionsPage() {
    const [reports, setReports] = useState<AdminReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openId, setOpenId] = useState<number | null>(null);

    const fetchReports = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const token = localStorage.getItem('admin_token') || '';
            const res = await fetch(`${getApiBaseUrl()}/admin/fill-reports?limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const json = await res.json();
            if (!json.success) throw new Error(json.message || 'Failed to load submissions');
            setReports(json.data || []);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchReports(); }, [fetchReports]);

    const q = search.trim().toLowerCase();
    const filtered = q
        ? reports.filter((r) =>
            (r.user_name || '').toLowerCase().includes(q) ||
            (r.user_email || '').toLowerCase().includes(q) ||
            r.exam_id.toLowerCase().includes(q) ||
            r.section_name.toLowerCase().includes(q))
        : reports;

    return (
        <div className="min-h-screen bg-[#F6F8FA] flex">
            <AdminSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <AdminHeader />
                <main className="flex-1 p-4 overflow-auto">
                    <div className="mb-4">
                        <h1 className="text-lg font-semibold text-slate-900">Submissions</h1>
                        <p className="text-sm text-slate-500">Audit trail of every form filled — what was submitted, what the student changed, and their confirmation.</p>
                    </div>

                    <div className="mb-3 flex items-center gap-2">
                        <div className="relative">
                            <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search by student, email, or exam"
                                className="w-72 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                            />
                        </div>
                        <button onClick={fetchReports} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                            Refresh
                        </button>
                    </div>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        {isLoading && <p className="p-6 text-center text-sm text-slate-500">Loading submissions…</p>}
                        {error && <p className="p-6 text-center text-sm text-rose-600">{error}</p>}
                        {!isLoading && !error && filtered.length === 0 && (
                            <p className="p-10 text-center text-sm text-slate-500">No submissions found.</p>
                        )}

                        {!isLoading && !error && filtered.length > 0 && (
                            <table className="w-full">
                                <thead className="bg-[#F6F8FA] border-b border-slate-200">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STUDENT</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">FORM</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">RESULT</th>
                                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBMITTED</th>
                                        <th className="px-4 py-2 text-right text-xs font-semibold text-slate-700">ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-2.5">
                                                <div className="flex items-center gap-2">
                                                    <FiUser className="text-slate-400" />
                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-medium text-slate-800">{r.user_name || 'Unknown'}</p>
                                                        <p className="truncate text-xs text-slate-500">{r.user_email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <p className="text-sm text-slate-800">{humanizeExam(r.exam_id)}</p>
                                                <p className="text-xs text-slate-500">{r.section_name}</p>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <span className="text-xs text-slate-600">{r.filled_count}/{r.total_fields} filled</span>
                                                    {r.confirmed_at && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[11px] font-medium text-[#FAD53C]">
                                                            <FiCheckCircle className="text-[10px]" /> Confirmed
                                                        </span>
                                                    )}
                                                    {r.has_changes && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                                                            <FiEdit2 className="text-[10px]" /> Edited
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2.5 text-sm text-slate-600">{formatDateTime(r.created_at)}</td>
                                            <td className="px-4 py-2.5 text-right">
                                                <button
                                                    onClick={() => setOpenId(r.id)}
                                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                >
                                                    <FiFileText /> View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </main>
            </div>

            {openId != null && <DetailModal id={openId} onClose={() => setOpenId(null)} />}
        </div>
    );
}
