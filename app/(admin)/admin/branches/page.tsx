'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllBranches, createBranch, updateBranch, deleteBranch, downloadBranchesBulkTemplate, downloadAllBranchesExcel, bulkUploadBranches, type Branch } from '@/api/admin/branches';
import { getAllPrograms, type Program } from '@/api/admin/programs';
import { getAllStreams } from '@/api/admin/streams';
import { getAllCareerGoals } from '@/api/admin/career-goals';
import { FiPlus, FiSearch, FiX, FiUpload, FiDownload } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, MultiSelect, Dropdown, type MultiSelectOption } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function BranchesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [allBranches, setAllBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: true,
    streamId: '',
    interestIds: [] as string[],
    programIds: [] as string[],
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [streams, setStreams] = useState<{ id: number; name: string; status?: boolean }[]>([]);
  const [careerGoals, setCareerGoals] = useState<{ id: number; label: string; status?: boolean }[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; createdBranches: { id: number; name: string }[]; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const { canDownloadExcel } = useAdminPermissions();

  const programOptions: MultiSelectOption[] = programs.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));
  const streamOptions = streams.map((s) => ({ value: String(s.id), label: s.name }));
  const interestOptions: MultiSelectOption[] = careerGoals.map((g) => ({ value: String(g.id), label: g.label }));

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) { router.replace('/admin/login'); return; }
    fetchBranches();
    (async () => {
      try {
        const [pr, sr, cg] = await Promise.all([getAllPrograms(), getAllStreams(), getAllCareerGoals()]);
        if (pr.success && pr.data?.programs) setPrograms(pr.data.programs.filter((p) => p.status !== false));
        if (sr.success && sr.data?.streams) setStreams(sr.data.streams.filter((s) => s.status !== false));
        if (cg.success && cg.data?.careerGoals) setCareerGoals(cg.data.careerGoals.filter((g) => g.status !== false));
      } catch {
        /* ignore */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allBranches.length === 0) { setBranches([]); return; }
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) { setBranches(allBranches); return; }
      const q = searchQuery.toLowerCase();
      setBranches(
        allBranches.filter(
          (b) =>
            b.name.toLowerCase().includes(q) ||
            (b.description && b.description.toLowerCase().includes(q)) ||
            (b.program_names && b.program_names.toLowerCase().includes(q)) ||
            (b.stream_name && b.stream_name.toLowerCase().includes(q)) ||
            (b.interest_labels && b.interest_labels.toLowerCase().includes(q))
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allBranches]);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const res = await getAllBranches();
      if (res.success && res.data) { setAllBranches(res.data.branches); setBranches(res.data.branches); }
      else setError(res.message || 'Failed to fetch branches');
    } catch { setError('An error occurred while fetching branches'); }
    finally { setIsLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.name.trim()) { setError('Name is required'); return; }
    try {
      const program_ids = formData.programIds
        .map((id) => parseInt(id, 10))
        .filter((n) => Number.isInteger(n) && n > 0);
      const stream_id = formData.streamId ? parseInt(formData.streamId, 10) : null;
      const interest_ids = formData.interestIds.map((id) => parseInt(id, 10)).filter((n) => !Number.isNaN(n));
      const body = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        stream_id,
        interest_ids,
        program_ids,
      };
      if (editingBranch) {
        const res = await updateBranch(editingBranch.id, body);
        if (res.success) { showSuccess('Branch updated'); setShowModal(false); resetForm(); fetchBranches(); }
        else { setError(res.message || 'Failed to update'); showError(res.message || 'Failed to update'); }
      } else {
        const res = await createBranch(body);
        if (res.success) { showSuccess('Branch created'); setShowModal(false); resetForm(); fetchBranches(); }
        else { setError(res.message || 'Failed to create'); showError(res.message || 'Failed to create'); }
      }
    } catch { setError('An error occurred'); showError('An error occurred'); }
  };

  const handleDeleteClick = (id: number) => { setDeletingId(id); setShowDeleteConfirm(true); };
  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const res = await deleteBranch(deletingId);
      if (res.success) { showSuccess('Branch deleted'); fetchBranches(); }
      else showError(res.message || 'Failed to delete');
    } catch { showError('An error occurred'); }
    finally { setIsDeleting(false); setShowDeleteConfirm(false); setDeletingId(null); }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    const iids = Array.isArray(branch.interest_ids) ? branch.interest_ids : [];
    setFormData({
      name: branch.name,
      description: branch.description || '',
      status: branch.status,
      streamId: branch.stream_id != null ? String(branch.stream_id) : '',
      interestIds: iids.map(String),
      programIds: (branch.program_ids ?? []).map(String),
    });
    setShowModal(true);
  };

  const handleCreate = () => { setEditingBranch(null); resetForm(); setShowModal(true); };
  const resetForm = () => {
    setFormData({ name: '', description: '', status: true, streamId: '', interestIds: [], programIds: [] });
    setError(null);
  };
  const handleModalClose = () => { setShowModal(false); setEditingBranch(null); resetForm(); };

  const handleDownloadTemplate = async () => {
    try { setDownloadingTemplate(true); await downloadBranchesBulkTemplate(); showSuccess('Template downloaded'); }
    catch { showError('Failed to download template'); }
    finally { setDownloadingTemplate(false); }
  };

  const handleDownloadExcel = async () => {
    try { setDownloadingExcel(true); await downloadAllBranchesExcel(); showSuccess('Excel downloaded'); }
    catch { showError('Failed to download Excel'); }
    finally { setDownloadingExcel(false); }
  };

  const handleBulkUpload = async () => {
    if (!bulkExcelFile) { setBulkError('Please select an Excel file'); return; }
    try {
      setBulkUploading(true); setBulkError(null); setBulkResult(null);
      const res = await bulkUploadBranches(bulkExcelFile);
      if (res.success && res.data) {
        setBulkResult({ created: res.data.created, createdBranches: res.data.createdBranches || [], errors: res.data.errors || 0, errorDetails: res.data.errorDetails || [] });
        showSuccess(res.message || `Created ${res.data.created} branch(es)`);
        fetchBranches();
        if (res.data.errors === 0) { setBulkExcelFile(null); setShowBulkModal(false); }
      } else setBulkError(res.message || 'Bulk upload failed');
    } catch { setBulkError('An error occurred during bulk upload'); showError('Bulk upload failed'); }
    finally { setBulkUploading(false); }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.replace('/admin/login')} className="text-[#341050] hover:underline">Go to login</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Branches / Courses Manager</h1>
            <p className="text-sm text-slate-600">Manage branches and courses like Computer Science, Electronics & Communication, etc.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">
                <span className="text-xs font-medium text-slate-700">All branches</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{allBranches.length}</span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" placeholder="Search name, programs, stream, interests" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canDownloadExcel && (
                <button type="button" onClick={handleDownloadExcel} disabled={downloadingExcel} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50">
                  <FiDownload className="h-4 w-4" />{downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              <button type="button" onClick={() => { setShowBulkModal(true); setBulkResult(null); setBulkError(null); setBulkExcelFile(null); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA]">
                <FiUpload className="h-4 w-4" />Upload Excel
              </button>
              <button onClick={handleCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90">
                <FiPlus className="h-4 w-4" />Add Branch
              </button>
            </div>
          </div>

          {error && <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{error}</div>}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading branches...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">DESCRIPTION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STREAM</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">INTERESTS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PROGRAMS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {branches.length === 0 ? (
                      <tr><td colSpan={8} className="px-4 py-4 text-center text-sm text-slate-500">{branches.length < allBranches.length ? 'No branches found matching your search' : 'No branches found'}</td></tr>
                    ) : branches.map((branch) => (
                      <tr key={branch.id} className="hover:bg-[#F6F8FA]">
                        <td className="px-4 py-2"><span className="text-sm font-medium text-slate-900">{branch.name}</span></td>
                        <td className="px-4 py-2"><span className="text-sm text-slate-600 line-clamp-1">{branch.description || '-'}</span></td>
                        <td className="px-4 py-2 text-sm text-slate-600">{branch.stream_name?.trim() || '—'}</td>
                        <td className="px-4 py-2 text-sm text-slate-600 max-w-[180px] line-clamp-2" title={branch.interest_labels || ''}>
                          {branch.interest_labels?.trim() ? branch.interest_labels : '—'}
                        </td>
                        <td className="px-4 py-2 max-w-[200px]"><span className="text-sm text-slate-600 line-clamp-2" title={branch.program_names || ''}>{branch.program_names?.trim() ? branch.program_names : '—'}</span></td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${branch.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {branch.status ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-600">{new Date(branch.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                        <td className="px-4 py-2"><AdminTableActions onEdit={() => handleEdit(branch)} onDelete={() => handleDeleteClick(branch.id)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingBranch ? 'Edit Branch' : 'Create Branch'}</h2>
              <button onClick={handleModalClose} className="text-slate-500 hover:text-slate-800"><FiX className="h-4 w-4" /></button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Branch Name <span className="text-[#341050]">*</span></label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none" placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-none" placeholder="Brief description of the branch / course..." />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Stream</label>
                  <Dropdown
                    value={formData.streamId || null}
                    onChange={(v) => setFormData({ ...formData, streamId: v ? String(v) : '' })}
                    options={streamOptions}
                    placeholder={streams.length ? 'Select stream (optional)' : 'No streams — add in Streams module'}
                    disabled={!streams.length}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Interests</label>
                  <MultiSelect
                    options={interestOptions}
                    value={formData.interestIds}
                    onChange={(ids) => setFormData({ ...formData, interestIds: ids })}
                    placeholder={careerGoals.length ? 'Select interests (optional)' : 'No interests — add in Interests module'}
                    disabled={!careerGoals.length}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Programs</label>
                  <MultiSelect
                    options={programOptions}
                    value={formData.programIds}
                    onChange={(ids) => setFormData({ ...formData, programIds: ids })}
                    placeholder="Select one or more programs…"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Linked to taxonomy programs (same names as in Programs manager).</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" checked={formData.status === true} onChange={() => setFormData({ ...formData, status: true })} className="w-4 h-4 text-[#341050] border-slate-300 focus:ring-[#341050]/25" /><span className="text-sm text-slate-700">Active</span></label>
                    <label className="flex items-center gap-2 cursor-pointer"><input type="radio" name="status" checked={formData.status === false} onChange={() => setFormData({ ...formData, status: false })} className="w-4 h-4 text-[#341050] border-slate-300 focus:ring-[#341050]/25" /><span className="text-sm text-slate-700">Inactive</span></label>
                  </div>
                </div>
                {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{error}</div>}
              </div>
            </form>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
              <button type="button" onClick={handleModalClose} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] mr-2">Cancel</button>
              <button type="submit" onClick={handleSubmit} className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90">{editingBranch ? 'Update Branch' : 'Create Branch'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk Upload Branches</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="text-slate-500 hover:text-slate-800"><FiX className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Sample template – Excel format</h3>
                <p className="text-xs text-slate-600 mb-3">
                  Optional <span className="font-mono">stream</span> and <span className="font-mono">interests</span> (comma/semicolon-separated interest labels).{' '}
                  <span className="font-mono">program_names</span> uses program display names (case-insensitive).
                </p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead><tr className="bg-slate-100">
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">name</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">description</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">status</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">stream</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">interests</th>
                      <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-slate-200">program_names</th>
                    </tr></thead>
                    <tbody>
                      <tr className="border-b border-slate-200"><td className="px-3 py-2 text-slate-800 border-r border-slate-200">Computer Science</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">CS & IT programs</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">TRUE</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">PCM</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">Engineering</td><td className="px-3 py-2 text-slate-800">B.Tech; M.Tech</td></tr>
                      <tr className="border-b border-slate-200"><td className="px-3 py-2 text-slate-800 border-r border-slate-200">Electronics & Communication</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">ECE branch</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">TRUE</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200" /><td className="px-3 py-2 text-slate-800 border-r border-slate-200" /><td className="px-3 py-2 text-slate-800">B.Tech</td></tr>
                      <tr><td className="px-3 py-2 text-slate-800 border-r border-slate-200">Mechanical Engineering</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">ME branch</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200">TRUE</td><td className="px-3 py-2 text-slate-800 border-r border-slate-200" /><td className="px-3 py-2 text-slate-800 border-r border-slate-200" /><td className="px-3 py-2 text-slate-800">—</td></tr>
                    </tbody>
                  </table>
                </div>
                <button type="button" onClick={handleDownloadTemplate} disabled={downloadingTemplate} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50">
                  <FiDownload className="h-4 w-4" />{downloadingTemplate ? 'Downloading...' : 'Download template'}
                </button>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Upload your Excel file</h3>
                <input type="file" accept=".xlsx,.xls" onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)} className="w-full text-sm border border-slate-300 rounded-lg p-2" />
              </div>
              {bulkError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{bulkError}</div>}
              {bulkResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Created: {bulkResult.created}</p>
                  {bulkResult.errors > 0 && <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>}
                  {bulkResult.errorDetails?.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 max-h-32 overflow-auto">{bulkResult.errorDetails.map((err, i) => (<li key={i}>Row {err.row}: {err.message}</li>))}</ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]">Close</button>
              <button onClick={handleBulkUpload} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50">{bulkUploading ? 'Uploading...' : 'Upload'}</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal isOpen={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setDeletingId(null); }} onConfirm={handleDeleteConfirm} title="Delete Branch" message="Are you sure you want to delete this branch? This action cannot be undone." confirmText="Delete" cancelText="Cancel" confirmButtonStyle="danger" isLoading={isDeleting} />
    </div>
  );
}
