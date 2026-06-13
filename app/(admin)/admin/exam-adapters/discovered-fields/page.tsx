'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  listDiscoveredFields,
  reviewDiscoveredField,
  DiscoveredField,
  DiscoveredFieldStatus
} from '@/api/admin/examAdapters';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import { useToast } from '@/components/shared';

const STATUS_TABS: DiscoveredFieldStatus[] = ['pending', 'approved', 'rejected'];

export default function DiscoveredFieldsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [fields, setFields] = useState<DiscoveredField[]>([]);
  const [statusTab, setStatusTab] = useState<DiscoveredFieldStatus>('pending');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchFields = useCallback(async (status: DiscoveredFieldStatus) => {
    try {
      setIsLoading(true);
      const res = await listDiscoveredFields(status);
      if (res.success && res.data) {
        setFields(res.data);
        setError(null);
      } else {
        setError(res.message || 'Failed to fetch discovered fields');
      }
    } catch (err) {
      setError('An error occurred while fetching discovered fields');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchFields(statusTab);
  }, [statusTab, fetchFields, router]);

  const handleReview = async (id: number, action: 'approve' | 'reject') => {
    try {
      setActingId(id);
      const res = await reviewDiscoveredField(id, action);
      if (res.success) {
        showSuccess(action === 'approve' ? 'Field approved — now in the whitelist' : 'Field rejected');
        fetchFields(statusTab);
      } else {
        showError(res.message || 'Failed to update field');
      }
    } catch (err) {
      showError('Failed to update field');
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <button
            onClick={() => router.push('/admin/exam-adapters')}
            className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
          >
            <FiArrowLeft className="h-4 w-4" />
            Back to Form Adapters
          </button>

          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Discovered Fields</h1>
            <p className="text-sm text-slate-600">
              Form fields the AI Builder found on portals but could not map to an existing profile path.
              Approve a field to add it to the whitelist so a re-scan can map it; reject ones that aren&apos;t useful.
            </p>
          </div>

          {/* Status tabs */}
          <div className="mb-3 flex items-center gap-3 flex-wrap">
            {STATUS_TABS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusTab(s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors capitalize text-xs font-medium ${
                  statusTab === s
                    ? 'bg-[#341050] text-white border-[#341050]'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-[#F6F8FA]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">FORM LABEL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">FIELD PATH</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">DISCOVERED FROM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PAGE URL</th>
                      {statusTab === 'pending' && (
                        <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {fields.length === 0 ? (
                      <tr>
                        <td colSpan={statusTab === 'pending' ? 6 : 5} className="px-4 py-6 text-center text-sm text-slate-500">
                          No {statusTab} fields.
                        </td>
                      </tr>
                    ) : (
                      fields.map((f) => (
                        <tr key={f.id} className="hover:bg-[#F6F8FA] transition-colors">
                          <td className="px-4 py-2 text-sm font-medium text-slate-900">
                            {f.discovered_label || f.label}
                          </td>
                          <td className="px-4 py-2 text-[11px] text-slate-500 font-mono">{f.field_path}</td>
                          <td className="px-4 py-2 text-sm text-slate-700">{f.type}</td>
                          <td className="px-4 py-2 text-sm text-slate-700">{f.discovered_from_exam || '—'}</td>
                          <td className="px-4 py-2 text-xs text-slate-600 font-mono max-w-[280px] truncate" title={f.discovered_page_url || ''}>
                            {f.discovered_page_url || '—'}
                          </td>
                          {statusTab === 'pending' && (
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleReview(f.id, 'approve')}
                                  disabled={actingId === f.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-60"
                                >
                                  <FiCheck className="h-3 w-3" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReview(f.id, 'reject')}
                                  disabled={actingId === f.id}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-white text-slate-700 border border-slate-300 hover:bg-slate-100 rounded-lg disabled:opacity-60"
                                >
                                  <FiX className="h-3 w-3" />
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
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
    </div>
  );
}
