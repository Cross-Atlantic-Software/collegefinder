'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  listExamAdapters,
  createExamAdapter,
  deleteExamAdapter,
  setExamAdapterStatus,
  ExamAdapter
} from '@/api/admin/examAdapters';
import { FiPlus, FiSearch, FiCheckCircle, FiClock, FiCpu, FiX, FiInbox } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast } from '@/components/shared';

type StatusFilter = 'all' | 'draft' | 'published';

export default function ExamAdaptersPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  const [adapters, setAdapters] = useState<ExamAdapter[]>([]);
  const [allAdapters, setAllAdapters] = useState<ExamAdapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ exam_id: '', exam_name: '', portal_url_pattern: '' });
  const [isCreating, setIsCreating] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchAdapters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAdapters = async () => {
    try {
      setIsLoading(true);
      const res = await listExamAdapters();
      if (res.success && res.data) {
        setAllAdapters(res.data);
      } else {
        setError(res.message || 'Failed to fetch adapters');
      }
    } catch (err) {
      setError('An error occurred while fetching adapters');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply search + filter
  useEffect(() => {
    const t = setTimeout(() => {
      let filtered = allAdapters;
      if (statusFilter !== 'all') {
        filtered = filtered.filter((a) => a.status === statusFilter);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.exam_id.toLowerCase().includes(q) ||
            a.exam_name.toLowerCase().includes(q) ||
            a.portal_url_pattern.toLowerCase().includes(q)
        );
      }
      setAdapters(filtered);
    }, 200);
    return () => clearTimeout(t);
  }, [searchQuery, statusFilter, allAdapters]);

  const handleCreate = async () => {
    const exam_id = createForm.exam_id.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
    if (!exam_id || !createForm.exam_name.trim() || !createForm.portal_url_pattern.trim()) {
      showError('All fields are required');
      return;
    }
    try {
      setIsCreating(true);
      const res = await createExamAdapter({
        exam_id,
        exam_name: createForm.exam_name.trim(),
        portal_url_pattern: createForm.portal_url_pattern.trim()
      });
      if (res.success && res.data) {
        showSuccess(`Registered "${res.data.exam_name}". Open it in the editor or use the extension Builder to scan a portal.`);
        setShowCreateModal(false);
        setCreateForm({ exam_id: '', exam_name: '', portal_url_pattern: '' });
        fetchAdapters();
      } else {
        showError(res.message || 'Failed to register exam');
      }
    } catch (err) {
      showError('Failed to register exam');
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleStatus = async (adapter: ExamAdapter) => {
    const next = adapter.status === 'published' ? 'draft' : 'published';
    const res = await setExamAdapterStatus(adapter.exam_id, next);
    if (res.success) {
      showSuccess(next === 'published' ? 'Adapter published' : 'Adapter unpublished');
      fetchAdapters();
    } else {
      showError(res.message || 'Failed to update status');
    }
  };

  const handleDeleteClick = (examId: string) => {
    setDeletingExamId(examId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingExamId) return;
    try {
      setIsDeleting(true);
      const res = await deleteExamAdapter(deletingExamId);
      if (res.success) {
        showSuccess('Adapter deleted');
        setShowDeleteConfirm(false);
        setDeletingExamId(null);
        fetchAdapters();
      } else {
        showError(res.message || 'Failed to delete');
      }
    } catch (err) {
      showError('Failed to delete adapter');
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const counts = {
    all: allAdapters.length,
    draft: allAdapters.filter((a) => a.status === 'draft').length,
    published: allAdapters.filter((a) => a.status === 'published').length
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Form Adapters</h1>
            <p className="text-sm text-slate-600">
              Manage the JSON adapter that tells the ExamFill Chrome extension how to map your student profile to each exam portal&apos;s form fields. Build new ones with the AI Builder inside the extension.
            </p>
          </div>

          {/* Filter pills */}
          <div className="mb-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {(['all', 'draft', 'published'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-colors ${
                    statusFilter === s
                      ? 'bg-[#341050] text-white border-[#341050]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-[#F6F8FA]'
                  }`}
                >
                  <span className="text-xs font-medium capitalize">{s}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs font-medium ${
                      statusFilter === s ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {counts[s]}
                  </span>
                </button>
              ))}
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by id, name, URL pattern"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-72"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/admin/exam-adapters/discovered-fields')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white text-slate-700 border border-slate-300 hover:bg-[#F6F8FA] rounded-lg"
              >
                <FiInbox className="h-4 w-4" />
                Discovered Fields
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg"
              >
                <FiPlus className="h-4 w-4" />
                Register New Exam
              </button>
            </div>
          </div>

          <div className="mb-3 text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <strong>Workflow:</strong> 1) Register the exam here (id + URL pattern). 2) Open the
            portal in Chrome with the ExamFill extension &mdash; admin Builder appears. 3) Scan each
            page; AI maps every field. 4) Edit the mappings here in the editor. 5) Click <em>Publish</em> so
            students can use it.
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading adapters…</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EXAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">URL PATTERN</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SECTIONS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">VERSION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">UPDATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adapters.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">
                          {allAdapters.length === 0
                            ? 'No adapters registered yet. Click "Register New Exam" to add one.'
                            : 'No adapters match your filters.'}
                        </td>
                      </tr>
                    ) : (
                      adapters.map((a) => (
                        <tr key={a.exam_id} className="hover:bg-[#F6F8FA] transition-colors">
                          <td className="px-4 py-2">
                            <div className="text-sm font-medium text-slate-900">{a.exam_name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                              {a.exam_id}
                              {a.is_ai_generated && (
                                <span title="AI-generated">
                                  <FiCpu className="h-3 w-3 text-amber-500" />
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600 font-mono">{a.portal_url_pattern}</td>
                          <td className="px-4 py-2 text-sm text-slate-700">{a.section_count ?? 0}</td>
                          <td className="px-4 py-2 text-sm text-slate-700">v{a.version}</td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleToggleStatus(a)}
                              title={a.status === 'published' ? 'Click to unpublish' : 'Click to publish'}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                a.status === 'published'
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                              }`}
                            >
                              {a.status === 'published' ? (
                                <FiCheckCircle className="h-3 w-3" />
                              ) : (
                                <FiClock className="h-3 w-3" />
                              )}
                              {a.status}
                            </button>
                          </td>
                          <td className="px-4 py-2 text-xs text-slate-600">
                            {a.updated_at
                              ? new Date(a.updated_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onEdit={() => router.push(`/admin/exam-adapters/${encodeURIComponent(a.exam_id)}`)}
                              onDelete={() => handleDeleteClick(a.exam_id)}
                            />
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

      {/* Register modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">Register New Exam</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Exam ID <span className="text-slate-400">(snake_case, e.g. kcet)</span>
                </label>
                <input
                  type="text"
                  value={createForm.exam_id}
                  onChange={(e) => setCreateForm({ ...createForm, exam_id: e.target.value })}
                  placeholder="kcet"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Name</label>
                <input
                  type="text"
                  value={createForm.exam_name}
                  onChange={(e) => setCreateForm({ ...createForm, exam_name: e.target.value })}
                  placeholder="Karnataka CET"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Portal URL Pattern <span className="text-slate-400">(must appear in the portal&apos;s URL)</span>
                </label>
                <input
                  type="text"
                  value={createForm.portal_url_pattern}
                  onChange={(e) => setCreateForm({ ...createForm, portal_url_pattern: e.target.value })}
                  placeholder="kcet.karnataka.gov.in"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Substring match. Use the most specific part (e.g. <code>kcet.karnataka.gov.in</code>, not just <code>karnataka.gov.in</code>).
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:bg-[#2a0c40] disabled:opacity-60"
              >
                {isCreating ? 'Registering…' : 'Register'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingExamId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Adapter"
        message={`Permanently delete the adapter for "${deletingExamId}"? Students will lose auto-fill on this portal until a new adapter is built.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
