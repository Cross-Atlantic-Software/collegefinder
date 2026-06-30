'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  listExamAdapters,
  createExamAdapter,
  importExamAdapter,
  deleteExamAdapter,
  setExamAdapterStatus,
  ExamAdapter,
  AdapterFile,
  UnmatchedField
} from '@/api/admin/examAdapters';
import { FiPlus, FiSearch, FiCheckCircle, FiClock, FiCpu, FiX, FiUpload } from 'react-icons/fi';
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

  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
  const [importPublish, setImportPublish] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    examName: string;
    version: number;
    published: boolean;
    unmatched: UnmatchedField[];
  } | null>(null);

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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result || ''));
    reader.onerror = () => showError('Could not read that file');
    reader.readAsText(file);
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleImport = async () => {
    const text = importText.trim();
    if (!text) {
      showError('Paste your adapter JSON or upload a .json file first');
      return;
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      showError('That is not valid JSON. Check the file content and try again.');
      return;
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      showError('The adapter file must be a JSON object.');
      return;
    }
    const obj = parsed as Record<string, unknown>;
    if (!obj.exam_id || !obj.exam_name || !obj.portal_url_pattern) {
      showError('File must include exam_id, exam_name and portal_url_pattern.');
      return;
    }
    if (!Array.isArray(obj.sections)) {
      showError('File must include a "sections" array.');
      return;
    }
    try {
      setIsImporting(true);
      const res = await importExamAdapter({
        adapter: obj as unknown as AdapterFile,
        publish: importPublish
      });
      if (res.success && res.data) {
        const unmatched = res.data.unmatched_fields || [];
        showSuccess(
          `Imported "${res.data.exam_name}" (v${res.data.version})${
            importPublish ? ' — published & live for the extension.' : ' — saved as draft.'
          }`
        );
        fetchAdapters();
        setImportText('');
        // Keep the modal open to show which form fields have no data in our user DB.
        setImportResult({
          examName: res.data.exam_name,
          version: res.data.version,
          published: importPublish,
          unmatched
        });
      } else {
        showError(res.message || 'Import failed');
      }
    } catch (err) {
      showError('Import failed');
      console.error(err);
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportModal = () => {
    setShowImportModal(false);
    setImportResult(null);
    setImportText('');
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
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-[#341050] text-[#341050] hover:bg-[#341050]/5 rounded-lg"
              >
                <FiUpload className="h-4 w-4" />
                Import Adapter JSON
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

      {/* Import adapter JSON modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <h2 className="text-base font-semibold text-slate-900">
                {importResult ? 'Import complete' : 'Import Adapter JSON'}
              </h2>
              <button onClick={closeImportModal} className="text-slate-400 hover:text-slate-600">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {!importResult ? (
              <>
                <div className="p-4 space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Paste your full adapter file (the same JSON you keep in{' '}
                    <code className="font-mono">examfill-extension/adapters/</code>) or upload the{' '}
                    <code className="font-mono">.json</code> file. It saves straight to the database —
                    no commit or deployment needed. The exam is matched by its{' '}
                    <code className="font-mono">exam_id</code>; importing an existing one updates it.
                  </p>

                  <div className="flex items-center justify-between gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 cursor-pointer">
                      <FiUpload className="h-3.5 w-3.5" />
                      Upload .json file
                      <input type="file" accept=".json,application/json" onChange={handleImportFile} className="hidden" />
                    </label>
                    {importText && (
                      <button
                        onClick={() => setImportText('')}
                        className="text-xs text-slate-500 hover:text-slate-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  <textarea
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={'{\n  "exam_id": "nata",\n  "exam_name": "NATA 2026",\n  "portal_url_pattern": "nata-app.org",\n  "sections": [ ... ]\n}'}
                    spellCheck={false}
                    className="w-full h-72 px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-y"
                  />

                  <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={importPublish}
                      onChange={(e) => setImportPublish(e.target.checked)}
                    />
                    Publish immediately (the extension starts using it right away). Uncheck to save as a draft.
                  </label>
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={closeImportModal}
                    className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={isImporting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:bg-[#2a0c40] disabled:opacity-60"
                  >
                    <FiUpload className="h-4 w-4" />
                    {isImporting ? 'Importing…' : importPublish ? 'Import & Publish' : 'Import as Draft'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 space-y-3">
                  <div className="flex items-start gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <FiCheckCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>{importResult.examName}</strong> saved (v{importResult.version}){' '}
                      {importResult.published ? '— published & live.' : '— saved as draft.'}
                    </span>
                  </div>

                  {importResult.unmatched.length === 0 ? (
                    <div className="text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-3">
                      ✅ Every field in this form maps to data in your user DB. Nothing missing.
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold text-amber-800 mb-1">
                        {importResult.unmatched.length} field
                        {importResult.unmatched.length === 1 ? '' : 's'} in this form have no matching
                        data in your user DB:
                      </p>
                      <p className="text-[11px] text-slate-500 mb-2">
                        The extension can&apos;t auto-fill these. Either add the data to your user
                        profile schema, or fix the field&apos;s <code className="font-mono">source</code> in the editor.
                      </p>
                      <div className="max-h-64 overflow-auto border border-slate-200 rounded-lg">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 sticky top-0">
                            <tr>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-600">SECTION</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-600">FIELD</th>
                              <th className="px-3 py-1.5 text-left font-semibold text-slate-600">ISSUE</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {importResult.unmatched.map((u, i) => (
                              <tr key={`${u.field_id}-${i}`}>
                                <td className="px-3 py-1.5 text-slate-600">{u.section}</td>
                                <td className="px-3 py-1.5">
                                  <div className="text-slate-800">{u.label || u.field_id}</div>
                                  {u.source && (
                                    <div className="text-[10px] text-slate-400 font-mono">{u.source}</div>
                                  )}
                                </td>
                                <td className="px-3 py-1.5">
                                  {u.reason === 'no_source' ? (
                                    <span className="text-slate-500">No data mapping set</span>
                                  ) : (
                                    <span className="text-amber-700">Source not in user DB</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => setImportResult(null)}
                    className="px-3 py-1.5 text-sm text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
                  >
                    Import another
                  </button>
                  <button
                    onClick={closeImportModal}
                    className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg hover:bg-[#2a0c40]"
                  >
                    Done
                  </button>
                </div>
              </>
            )}
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
