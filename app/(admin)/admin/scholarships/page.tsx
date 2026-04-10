'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllScholarshipsAdmin,
  getScholarshipById,
  createScholarship,
  updateScholarship,
  deleteScholarship,
  downloadScholarshipsBulkTemplate,
  downloadAllDataExcel,
  bulkUploadScholarships,
  deleteAllScholarships,
  type Scholarship,
  type ScholarshipEligibleCategory,
  type ScholarshipApplicableState,
  type ScholarshipDocumentRequired,
} from '@/api/admin/scholarships';
import { getAllExamsAdmin, type Exam } from '@/api/admin/exams';
import { getAllCollegesAdmin, type College } from '@/api/admin/colleges';
import { getAllStreams, type Stream } from '@/api/admin/streams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiDownload, FiEye } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect, Dropdown } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

type FormTab = 'basic' | 'categories' | 'states' | 'documents' | 'exams' | 'colleges';

const toDateInput = (val: string | null | undefined): string => {
  if (val == null || val === '') return '';
  const s = String(val).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : '';
};

export default function ScholarshipsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [allScholarships, setAllScholarships] = useState<Scholarship[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingScholarship, setEditingScholarship] = useState<Scholarship | null>(null);
  const [viewingData, setViewingData] = useState<{
    scholarship: Scholarship;
    streamName?: string | null;
    eligibleCategories: ScholarshipEligibleCategory[];
    applicableStates: ScholarshipApplicableState[];
    documentsRequired: ScholarshipDocumentRequired[];
    examIds: number[];
    examNames?: string[];
    collegeIds?: number[];
    collegeNames?: string[];
  } | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  const [formData, setFormData] = useState({
    scholarship_name: '',
    conducting_authority: '',
    scholarship_type: '',
    description: '',
    stream_id: '' as string | number,
    income_limit: '',
    minimum_marks_required: '',
    scholarship_amount: '',
    selection_process: '',
    application_start_date: '',
    application_end_date: '',
    mode: '',
    official_website: '',
    eligibleCategories: [] as { category: string }[],
    applicableStates: [] as { state_name: string }[],
    documentsRequired: [] as { document_name: string }[],
    examIds: [] as number[],
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdScholarships: { id: number; name: string }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const { canDownloadExcel, isSuperAdmin } = useAdminPermissions();
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Run once on mount to prevent continuous API calls
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allScholarships.length === 0) {
      setScholarships([]);
      return;
    }
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setScholarships(allScholarships);
        return;
      }
      const q = searchQuery.toLowerCase();
      setScholarships(
        allScholarships.filter(
          (s) =>
            s.scholarship_name.toLowerCase().includes(q) ||
            (s.conducting_authority && s.conducting_authority.toLowerCase().includes(q)) ||
            (s.scholarship_type && s.scholarship_type.toLowerCase().includes(q))
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allScholarships]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [schRes, streamsRes, examsRes, collegesRes] = await Promise.all([
        getAllScholarshipsAdmin(),
        getAllStreams(),
        getAllExamsAdmin(),
        getAllCollegesAdmin().catch(() => null),
      ]);
      if (schRes.success && schRes.data) {
        setAllScholarships(schRes.data.scholarships);
        setScholarships(schRes.data.scholarships);
      }
      if (streamsRes.success && streamsRes.data) {
        setStreams((streamsRes.data.streams || []).filter((s: Stream) => s.status !== false));
      }
      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data.exams || []);
      }
      if (collegesRes && collegesRes.success && collegesRes.data) {
        setColleges(collegesRes.data.colleges || []);
      } else {
        setColleges([]);
      }
    } catch (err) {
      setError('Failed to fetch scholarships');
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const payload = {
        scholarship_name: formData.scholarship_name.trim(),
        conducting_authority: formData.conducting_authority.trim() || null,
        scholarship_type: formData.scholarship_type.trim() || null,
        description: formData.description.trim() || null,
        stream_id: formData.stream_id === '' ? null : Number(formData.stream_id),
        income_limit: formData.income_limit.trim() || null,
        minimum_marks_required: formData.minimum_marks_required.trim() || null,
        scholarship_amount: formData.scholarship_amount.trim() || null,
        selection_process: formData.selection_process.trim() || null,
        application_start_date: formData.application_start_date || null,
        application_end_date: formData.application_end_date || null,
        mode: formData.mode.trim() || null,
        official_website: formData.official_website.trim() || null,
        eligibleCategories: formData.eligibleCategories.filter((c) => c.category?.trim()),
        applicableStates: formData.applicableStates.filter((s) => s.state_name?.trim()),
        documentsRequired: formData.documentsRequired.filter((d) => d.document_name?.trim()),
        examIds: formData.examIds,
      };
      if (editingScholarship) {
        const response = await updateScholarship(editingScholarship.id, payload);
        if (response.success && response.data) {
          showSuccess('Scholarship updated');
          setAllScholarships((prev) =>
            prev.map((s) => (s.id === editingScholarship.id ? response.data!.scholarship : s))
          );
          setScholarships((prev) =>
            prev.map((s) => (s.id === editingScholarship.id ? response.data!.scholarship : s))
          );
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Update failed');
          showError(response.message || 'Update failed');
        }
      } else {
        const response = await createScholarship(payload);
        if (response.success && response.data) {
          showSuccess('Scholarship created');
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Create failed');
          showError(response.message || 'Create failed');
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      setError(msg);
      showError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleView = async (scholarship: Scholarship) => {
    try {
      setLoadingView(true);
      const response = await getScholarshipById(scholarship.id);
      if (response.success && response.data) {
        setViewingData({
          scholarship: response.data.scholarship,
          streamName: response.data.streamName,
          eligibleCategories: response.data.eligibleCategories || [],
          applicableStates: response.data.applicableStates || [],
          documentsRequired: response.data.documentsRequired || [],
          examIds: response.data.examIds || [],
          examNames: response.data.examNames,
          collegeIds: response.data.collegeIds,
          collegeNames: response.data.collegeNames,
        });
      } else {
        showError('Failed to load scholarship');
      }
    } catch {
      showError('Failed to load scholarship');
    } finally {
      setLoadingView(false);
    }
  };

  const handleEdit = async (scholarship: Scholarship) => {
    try {
      const response = await getScholarshipById(scholarship.id);
      if (response.success && response.data) {
        const d = response.data;
        setFormData({
          scholarship_name: d.scholarship.scholarship_name ?? '',
          conducting_authority: d.scholarship.conducting_authority ?? '',
          scholarship_type: d.scholarship.scholarship_type ?? '',
          description: d.scholarship.description ?? '',
          stream_id: d.scholarship.stream_id ?? '',
          income_limit: d.scholarship.income_limit ?? '',
          minimum_marks_required: d.scholarship.minimum_marks_required ?? '',
          scholarship_amount: d.scholarship.scholarship_amount ?? '',
          selection_process: d.scholarship.selection_process ?? '',
          application_start_date: toDateInput(d.scholarship.application_start_date),
          application_end_date: toDateInput(d.scholarship.application_end_date),
          mode: d.scholarship.mode ?? '',
          official_website: d.scholarship.official_website ?? '',
          eligibleCategories: (d.eligibleCategories || []).map((c) => ({ category: c.category ?? '' })),
          applicableStates: (d.applicableStates || []).map((s) => ({ state_name: s.state_name ?? '' })),
          documentsRequired: (d.documentsRequired || []).map((doc) => ({ document_name: doc.document_name ?? '' })),
          examIds: d.examIds ?? [],
          collegeIds: d.collegeIds ?? [],
        });
        setEditingScholarship(d.scholarship);
        setActiveTab('basic');
        setShowModal(true);
      }
    } catch {
      showError('Failed to load scholarship');
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    try {
      setIsDeleting(true);
      const response = await deleteScholarship(deletingId);
      if (response.success) {
        showSuccess('Scholarship deleted');
        fetchData();
      } else {
        showError(response.message || 'Delete failed');
      }
    } catch {
      showError('Delete failed');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    setEditingScholarship(null);
    setFormData({
      scholarship_name: '',
      conducting_authority: '',
      scholarship_type: '',
      description: '',
      stream_id: '',
      income_limit: '',
      minimum_marks_required: '',
      scholarship_amount: '',
      selection_process: '',
      application_start_date: '',
      application_end_date: '',
      mode: '',
      official_website: '',
      eligibleCategories: [],
      applicableStates: [],
      documentsRequired: [],
      examIds: [],
      collegeIds: [],
    });
    setError(null);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingScholarship(null);
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadScholarshipsBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    }
  };

  const handleDownloadAllExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadAllDataExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleDeleteAllConfirm = async () => {
    try {
      setIsDeletingAll(true);
      const response = await deleteAllScholarships();
      if (response.success) {
        showSuccess(response.message || 'All scholarships deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchData(true);
      } else {
        showError(response.message || 'Failed to delete all scholarships');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all scholarships');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (!bulkExcelFile) {
      showError('Select an Excel file');
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadScholarships(bulkExcelFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} scholarship(s)`);
        fetchData(true);
      } else {
        setBulkError(res.message || 'Bulk upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bulk upload failed';
      setBulkError(msg);
      showError(msg);
    } finally {
      setBulkUploading(false);
    }
  };

  const addCategory = () => setFormData((prev) => ({ ...prev, eligibleCategories: [...prev.eligibleCategories, { category: '' }] }));
  const removeCategory = (i: number) => setFormData((prev) => ({ ...prev, eligibleCategories: prev.eligibleCategories.filter((_, idx) => idx !== i) }));
  const updateCategory = (i: number, v: string) => {
    setFormData((prev) => {
      const next = [...prev.eligibleCategories];
      if (next[i]) next[i] = { category: v };
      return { ...prev, eligibleCategories: next };
    });
  };

  const addState = () => setFormData((prev) => ({ ...prev, applicableStates: [...prev.applicableStates, { state_name: '' }] }));
  const removeState = (i: number) => setFormData((prev) => ({ ...prev, applicableStates: prev.applicableStates.filter((_, idx) => idx !== i) }));
  const updateState = (i: number, v: string) => {
    setFormData((prev) => {
      const next = [...prev.applicableStates];
      if (next[i]) next[i] = { state_name: v };
      return { ...prev, applicableStates: next };
    });
  };

  const addDocument = () => setFormData((prev) => ({ ...prev, documentsRequired: [...prev.documentsRequired, { document_name: '' }] }));
  const removeDocument = (i: number) => setFormData((prev) => ({ ...prev, documentsRequired: prev.documentsRequired.filter((_, idx) => idx !== i) }));
  const updateDocument = (i: number, v: string) => {
    setFormData((prev) => {
      const next = [...prev.documentsRequired];
      if (next[i]) next[i] = { document_name: v };
      return { ...prev, documentsRequired: next };
    });
  };

  const tabs: { id: FormTab; label: string }[] = [
    { id: 'basic', label: 'Basic' },
    { id: 'categories', label: 'Categories' },
    { id: 'states', label: 'States' },
    { id: 'documents', label: 'Documents' },
    { id: 'exams', label: 'Exams' },
  ];

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.replace('/admin/login')} className="text-[#341050] hover:underline">
            Go to login
          </button>
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
            <h1 className="text-xl font-bold text-slate-900 mb-1">Scholarships Manager</h1>
            <p className="text-sm text-slate-600">
              Manage scholarships with eligibility, states, documents, related exams and colleges. CRUD and Excel bulk upload.
            </p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">
                <span className="text-xs font-medium text-slate-700">All scholarships</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{allScholarships.length}</span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, authority, type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <button type="button" onClick={handleCreate} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90">
                <FiPlus className="h-4 w-4" />
                Add Scholarship
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkResult(null);
                  setBulkError(null);
                  setBulkExcelFile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              {canDownloadExcel && (
                <button
                  type="button"
                  onClick={handleDownloadAllExcel}
                  disabled={downloadingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              {isSuperAdmin && allScholarships.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  disabled={isDeletingAll}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 disabled:opacity-50"
                >
                  <FiTrash2 className="h-4 w-4" />
                  Delete All
                </button>
              )}
            </div>
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{error}</div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading scholarships...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">AUTHORITY</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">APPLICATION PERIOD</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {scholarships.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                          {scholarships.length < allScholarships.length ? 'No scholarships match your search' : 'No scholarships yet'}
                        </td>
                      </tr>
                    ) : (
                      scholarships.map((s) => (
                        <tr key={s.id} className="hover:bg-[#F6F8FA]">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-slate-900">{s.scholarship_name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-slate-600">{s.conducting_authority || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-slate-600">{s.scholarship_type || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-slate-600">
                              {s.application_start_date && s.application_end_date
                                ? `${String(s.application_start_date).slice(0, 10)} to ${String(s.application_end_date).slice(0, 10)}`
                                : '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(s)}
                              onEdit={() => handleEdit(s)}
                              onDelete={() => handleDeleteClick(s.id)}
                              loadingView={loadingView}
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

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingScholarship ? 'Edit Scholarship' : 'Create Scholarship'}</h2>
              <button type="button" onClick={handleModalClose} className="text-slate-500 hover:text-slate-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="shrink-0 flex border-b border-slate-200 bg-slate-100 px-4 gap-1 overflow-x-auto min-h-[44px] items-end">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 px-3 text-sm font-medium border-b-2 whitespace-nowrap -mb-px ${
                    activeTab === tab.id ? 'border-[#341050] text-[#341050] bg-white rounded-t' : 'border-transparent text-slate-700 hover:text-slate-900 hover:bg-slate-200/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
              {activeTab === 'basic' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship Name *</label>
                    <input
                      type="text"
                      value={formData.scholarship_name}
                      onChange={(e) => setFormData({ ...formData, scholarship_name: e.target.value })}
                      required
                      placeholder="e.g. National Scholarship Portal"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Conducting Authority</label>
                    <input
                      type="text"
                      value={formData.conducting_authority}
                      onChange={(e) => setFormData({ ...formData, conducting_authority: e.target.value })}
                      placeholder="e.g. Ministry of Education"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship Type</label>
                    <input
                      type="text"
                      value={formData.scholarship_type}
                      onChange={(e) => setFormData({ ...formData, scholarship_type: e.target.value })}
                      placeholder="e.g. Merit-cum-Means"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description..."
                      rows={3}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Stream</label>
                    <Dropdown<number>
                      value={typeof formData.stream_id === 'number' ? formData.stream_id : null}
                      onChange={(v) => setFormData({ ...formData, stream_id: v })}
                      options={streams.map((st) => ({ value: st.id, label: st.name }))}
                      placeholder="Select stream"
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Income Limit</label>
                      <input
                        type="text"
                        value={formData.income_limit}
                        onChange={(e) => setFormData({ ...formData, income_limit: e.target.value })}
                        placeholder="e.g. Up to 2.5 Lakh"
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Minimum Marks Required</label>
                      <input
                        type="text"
                        value={formData.minimum_marks_required}
                        onChange={(e) => setFormData({ ...formData, minimum_marks_required: e.target.value })}
                        placeholder="e.g. 60%"
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Scholarship Amount</label>
                    <input
                      type="text"
                      value={formData.scholarship_amount}
                      onChange={(e) => setFormData({ ...formData, scholarship_amount: e.target.value })}
                      placeholder="e.g. Up to 20000 per annum"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Selection Process</label>
                    <textarea
                      value={formData.selection_process}
                      onChange={(e) => setFormData({ ...formData, selection_process: e.target.value })}
                      placeholder="Merit and income based..."
                      rows={2}
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Application Start Date</label>
                      <input
                        type="date"
                        value={formData.application_start_date}
                        onChange={(e) => setFormData({ ...formData, application_start_date: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Application End Date</label>
                      <input
                        type="date"
                        value={formData.application_end_date}
                        onChange={(e) => setFormData({ ...formData, application_end_date: e.target.value })}
                        className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Mode</label>
                    <input
                      type="text"
                      value={formData.mode}
                      onChange={(e) => setFormData({ ...formData, mode: e.target.value })}
                      placeholder="e.g. Online"
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Official Website</label>
                    <input
                      type="url"
                      value={formData.official_website}
                      onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'categories' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-slate-700">Eligible Categories</label>
                    <button type="button" onClick={addCategory} className="text-sm text-[#341050] hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {formData.eligibleCategories.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item.category}
                          onChange={(e) => updateCategory(i, e.target.value)}
                          placeholder="e.g. SC, ST, OBC"
                          className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded"
                        />
                        <button type="button" onClick={() => removeCategory(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.eligibleCategories.length === 0 && <p className="text-sm text-slate-500">No categories. Click &quot;Add&quot; to add one.</p>}
                  </div>
                </>
              )}

              {activeTab === 'states' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-slate-700">Applicable States</label>
                    <button type="button" onClick={addState} className="text-sm text-[#341050] hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {formData.applicableStates.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item.state_name}
                          onChange={(e) => updateState(i, e.target.value)}
                          placeholder="e.g. Maharashtra"
                          className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded"
                        />
                        <button type="button" onClick={() => removeState(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.applicableStates.length === 0 && <p className="text-sm text-slate-500">No states. Click &quot;Add&quot; to add one.</p>}
                  </div>
                </>
              )}

              {activeTab === 'documents' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-slate-700">Documents Required</label>
                    <button type="button" onClick={addDocument} className="text-sm text-[#341050] hover:underline">+ Add</button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-auto">
                    {formData.documentsRequired.map((item, i) => (
                      <div key={i} className="flex gap-2">
                        <input
                          type="text"
                          value={item.document_name}
                          onChange={(e) => updateDocument(i, e.target.value)}
                          placeholder="e.g. Income certificate"
                          className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded"
                        />
                        <button type="button" onClick={() => removeDocument(i)} className="text-red-600 text-sm">Remove</button>
                      </div>
                    ))}
                    {formData.documentsRequired.length === 0 && <p className="text-sm text-slate-500">No documents. Click &quot;Add&quot; to add one.</p>}
                  </div>
                </>
              )}

              {activeTab === 'exams' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Related Exams</label>
                  <MultiSelect
                    options={exams.map((e) => ({ value: String(e.id), label: `${e.name} (${e.code})` }))}
                    value={formData.examIds.map(String)}
                    onChange={(vals) => setFormData({ ...formData, examIds: vals.map(Number) })}
                    placeholder="Select exams"
                  />
                </div>
              )}

              {activeTab === 'colleges' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Related Colleges</label>
                  {colleges.length === 0 ? (
                    <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                      No colleges loaded. Ensure your admin role includes the Colleges module so the list can be fetched.
                    </p>
                  ) : (
                    <MultiSelect
                      options={colleges.map((c) => ({ value: String(c.id), label: c.college_name }))}
                      value={formData.collegeIds.map(String)}
                      onChange={(vals) => setFormData({ ...formData, collegeIds: vals.map(Number) })}
                      placeholder="Select colleges"
                    />
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={handleModalClose} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-sm bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 disabled:opacity-50">
                  {isSaving ? 'Saving...' : editingScholarship ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-slate-900">{viewingData.scholarship?.scholarship_name ?? 'Scholarship'}</h2>
              <button type="button" onClick={() => setViewingData(null)} className="text-slate-500 hover:text-slate-700">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Conducting authority:</strong> {viewingData.scholarship?.conducting_authority ?? '-'}</p>
              <p><strong>Type:</strong> {viewingData.scholarship?.scholarship_type ?? '-'}</p>
              <p><strong>Stream:</strong> {viewingData.streamName ?? '-'}</p>
              <p><strong>Income limit:</strong> {viewingData.scholarship?.income_limit ?? '-'}</p>
              <p><strong>Minimum marks required:</strong> {viewingData.scholarship?.minimum_marks_required ?? '-'}</p>
              <p><strong>Scholarship amount:</strong> {viewingData.scholarship?.scholarship_amount ?? '-'}</p>
              <p><strong>Selection process:</strong> {viewingData.scholarship?.selection_process ?? '-'}</p>
              <p><strong>Mode:</strong> {viewingData.scholarship?.mode ?? '-'}</p>
              <p><strong>Application period:</strong> {viewingData.scholarship?.application_start_date && viewingData.scholarship?.application_end_date ? `${String(viewingData.scholarship.application_start_date).slice(0, 10)} to ${String(viewingData.scholarship.application_end_date).slice(0, 10)}` : '-'}</p>
              <p><strong>Official website:</strong>{' '}
                {viewingData.scholarship?.official_website ? (
                  <a href={viewingData.scholarship.official_website} target="_blank" rel="noopener noreferrer" className="text-[#341050] hover:underline">{viewingData.scholarship.official_website}</a>
                ) : '-'}
              </p>
            </div>
            {viewingData.scholarship?.description && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">Description</p>
                <p className="text-sm text-slate-600">{viewingData.scholarship.description}</p>
              </div>
            )}
            {((viewingData.eligibleCategories ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">Eligible categories</p>
                <p className="text-sm text-slate-600">{(viewingData.eligibleCategories ?? []).map((c) => c.category).filter(Boolean).join(', ')}</p>
              </div>
            )}
            {((viewingData.applicableStates ?? []).length > 0) && (
              <div className="mt-2">
                <p className="text-sm font-medium text-slate-700">Applicable states</p>
                <p className="text-sm text-slate-600">{(viewingData.applicableStates ?? []).map((s) => s.state_name).filter(Boolean).join(', ')}</p>
              </div>
            )}
            {((viewingData.documentsRequired ?? []).length > 0) && (
              <div className="mt-2">
                <p className="text-sm font-medium text-slate-700">Documents required</p>
                <p className="text-sm text-slate-600">{(viewingData.documentsRequired ?? []).map((d) => d.document_name).filter(Boolean).join(', ')}</p>
              </div>
            )}
            {((viewingData.examNames ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">Related exams</p>
                <p className="text-sm text-slate-600">{(viewingData.examNames ?? []).join(', ')}</p>
              </div>
            )}
            {((viewingData.collegeNames ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <p className="text-sm font-medium text-slate-700">Related colleges</p>
                <p className="text-sm text-slate-600">{(viewingData.collegeNames ?? []).join(', ')}</p>
              </div>
            )}
            <button type="button" onClick={() => { setViewingData(null); handleEdit(viewingData.scholarship); }} className="mt-4 px-3 py-1.5 text-sm bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90">Edit</button>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bulk Upload Scholarships</h2>
              <button type="button" onClick={() => setShowBulkModal(false)} className="text-slate-500 hover:text-slate-700">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upload an Excel file. Use the template; columns include scholarship fields, exam_names, and college_names (comma or semicolon separated; names must match colleges in the database, case-insensitive). Optional college_ids column accepts comma-separated IDs.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Excel file *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
              </div>
              {canDownloadExcel && (
                <button type="button" onClick={handleBulkTemplateDownload} className="inline-flex items-center gap-2 text-sm text-[#341050] hover:underline">
                  <FiDownload className="h-4 w-4" />
                  Download Excel template
                </button>
              )}
            </div>
            {bulkError && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{bulkError}</div>}
            {bulkResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Created: {bulkResult.created}. {bulkResult.errors > 0 && `Errors: ${bulkResult.errors} row(s).`}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">Close</button>
              <button type="button" onClick={handleBulkSubmit} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 disabled:opacity-50">
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeletingId(null); }}
        onConfirm={handleDeleteConfirm}
        title="Delete Scholarship"
        message="Are you sure you want to delete this scholarship? All related data will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Scholarships"
        message={`Are you sure you want to delete all ${allScholarships.length} scholarships? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />
    </div>
  );
}
