'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCollegesAdmin,
  getCollegeById,
  createCollege,
  updateCollege,
  deleteCollege,
  uploadCollegeLogo,
  downloadCollegesBulkTemplate,
  downloadAllDataExcel,
  bulkUploadColleges,
  deleteAllColleges,
  type College,
  type CollegeWithDetails,
} from '@/api/admin/colleges';
import { getAllPrograms, type Program } from '@/api/admin/programs';
import { getAllExamsAdmin, type Exam } from '@/api/admin/exams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiDownload, FiEye } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect } from '@/components/shared';
import Image from 'next/image';

export default function CollegesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [viewingData, setViewingData] = useState<CollegeWithDetails | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [formData, setFormData] = useState({
    college_name: '',
    college_location: '',
    college_type: '' as 'Central' | 'State' | 'Private' | 'Deemed' | '',
    college_logo: '',
    college_description: '',
    collegeKeyDates: [] as { event_name: string; event_date: string }[],
    collegeDocumentsRequired: [] as { document_name: string }[],
    collegeCounsellingProcess: [] as { step_number: number; description: string }[],
    recommendedExamIds: [] as number[],
    collegePrograms: [] as {
      program_id: number;
      intake_capacity: number | null;
      duration_years: number | null;
      seatMatrix: { category: string; seat_count: number | null; year: number | null }[];
      previousCutoffs: { exam_id: number; category: string; cutoff_rank: number | null; year: number | null }[];
      expectedCutoffs: { exam_id: number; category: string; expected_rank: number | null; year: number | null }[];
    }[],
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [recommendedExamOptions, setRecommendedExamOptions] = useState<{ value: string; label: string }[]>([]);
  const [, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkLogoFiles, setBulkLogoFiles] = useState<File[]>([]);
  const [bulkLogosZipFile, setBulkLogosZipFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; createdColleges: { id: number; name: string }[]; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ type?: string } | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);

  // Run once on mount: auth check and load list + dropdowns. Empty deps prevent re-running and continuous API calls.
  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      try {
        setCurrentAdmin(JSON.parse(adminUserStr));
      } catch (_) {}
    }
    fetchData();
    (async () => {
      try {
        const [progRes, examRes] = await Promise.all([getAllPrograms(), getAllExamsAdmin()]);
        if (progRes.success && progRes.data?.programs) setPrograms(progRes.data.programs);
        if (examRes.success && examRes.data?.exams) {
          setExams(examRes.data.exams);
          setRecommendedExamOptions(examRes.data.exams.map((e) => ({ value: String(e.id), label: e.exam_name || String(e.id) })));
        }
      } catch (_) {}
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allColleges.length === 0) {
      setColleges([]);
      return;
    }
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setColleges(allColleges);
        return;
      }
      const q = searchQuery.toLowerCase();
      setColleges(allColleges.filter((c) =>
        c.college_name.toLowerCase().includes(q) ||
        (c.college_location && c.college_location.toLowerCase().includes(q)) ||
        (c.college_type && c.college_type.toLowerCase().includes(q))
      ));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allColleges]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const res = await getAllCollegesAdmin();
      if (res.success && res.data) {
        setAllColleges(res.data.colleges);
        setColleges(res.data.colleges);
      }
    } catch (err) {
      setError('Failed to fetch colleges');
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadCollegeLogo(file);
      if (response.success && response.data?.logoUrl) {
        setFormData((prev) => ({ ...prev, college_logo: response.data!.logoUrl }));
        setLogoPreview(response.data!.logoUrl);
        showSuccess('Logo uploaded');
      } else {
        showError(response.message || 'Upload failed');
      }
    } catch {
      showError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
      handleLogoUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const recommendedExamNames = formData.recommendedExamIds
        .map((id) => exams.find((e) => e.id === id)?.exam_name)
        .filter((n): n is string => Boolean(n));
      const payload = {
        college_name: formData.college_name.trim(),
        college_location: formData.college_location.trim() || null,
        college_type: formData.college_type || null,
        college_logo: formData.college_logo || null,
        college_description: formData.college_description.trim() || null,
        collegeKeyDates: formData.collegeKeyDates.filter((k) => k.event_name?.trim() || k.event_date),
        collegeDocumentsRequired: formData.collegeDocumentsRequired.filter((d) => d.document_name?.trim()).map((d) => ({ document_name: d.document_name!.trim() })),
        collegeCounsellingProcess: formData.collegeCounsellingProcess.filter((c) => c.step_number != null || c.description?.trim()).map((c) => ({ step_number: c.step_number, description: c.description?.trim() || undefined })),
        recommendedExamNames: recommendedExamNames.length ? recommendedExamNames : undefined,
        recommendedExamIds: recommendedExamNames.length ? undefined : formData.recommendedExamIds,
        collegePrograms: formData.collegePrograms.filter((p) => p.program_id).map((p) => ({
          program_id: p.program_id,
          intake_capacity: p.intake_capacity,
          duration_years: p.duration_years ?? null,
          seatMatrix: (p.seatMatrix || []).filter((s) => s.category?.trim() || s.seat_count != null || s.year != null).map((s) => ({ category: s.category || undefined, seat_count: s.seat_count ?? undefined, year: s.year ?? undefined })),
          previousCutoffs: (p.previousCutoffs || []).filter((c) => c.exam_id).map((c) => ({ exam_id: c.exam_id, category: c.category || undefined, cutoff_rank: c.cutoff_rank ?? undefined, year: c.year ?? undefined })),
          expectedCutoffs: (p.expectedCutoffs || []).filter((c) => c.exam_id).map((c) => ({ exam_id: c.exam_id, category: c.category || undefined, expected_rank: c.expected_rank ?? undefined, year: c.year ?? undefined })),
        })),
      };
      if (editingCollege) {
        const response = await updateCollege(editingCollege.id, payload);
        if (response.success && response.data) {
          showSuccess('College updated');
          setAllColleges((prev) => prev.map((c) => (c.id === editingCollege.id ? response.data!.college : c)));
          setColleges((prev) => prev.map((c) => (c.id === editingCollege.id ? response.data!.college : c)));
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Update failed');
          showError(response.message || 'Update failed');
        }
      } else {
        const response = await createCollege(payload);
        if (response.success && response.data) {
          showSuccess('College created');
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

  const handleView = async (college: College) => {
    try {
      setLoadingView(true);
      const response = await getCollegeById(college.id);
      if (response.success && response.data) {
        setViewingData({
          ...response.data.college,
          collegeDetails: response.data.collegeDetails,
          collegePrograms: response.data.collegePrograms,
          collegeKeyDates: response.data.collegeKeyDates,
          collegeDocumentsRequired: response.data.collegeDocumentsRequired,
          collegeCounsellingProcess: response.data.collegeCounsellingProcess,
          recommendedExamIds: response.data.recommendedExamIds,
        });
      } else {
        showError('Failed to load college');
      }
    } catch {
      showError('Failed to load college');
    } finally {
      setLoadingView(false);
    }
  };

  const handleEdit = async (college: College) => {
    setLoadingView(true);
    try {
      const response = await getCollegeById(college.id);
      if (response.success && response.data) {
        const d = response.data;
        setFormData({
          college_name: d.college.college_name ?? '',
          college_location: d.college.college_location ?? '',
          college_type: (d.college.college_type as 'Central' | 'State' | 'Private' | 'Deemed') ?? '',
          college_logo: d.college.college_logo ?? '',
          college_description: d.collegeDetails?.college_description ?? '',
          collegeKeyDates: (d.collegeKeyDates || []).map((k) => ({ event_name: k.event_name ?? '', event_date: k.event_date?.toString().slice(0, 10) ?? '' })),
          collegeDocumentsRequired: (d.collegeDocumentsRequired || []).map((doc) => ({ document_name: doc.document_name ?? '' })),
          collegeCounsellingProcess: (d.collegeCounsellingProcess || []).map((c) => ({ step_number: c.step_number ?? 0, description: c.description ?? '' })),
          recommendedExamIds: d.recommendedExamIds ?? [],
          collegePrograms: (d.collegePrograms || []).map((p) => ({
            program_id: p.program_id,
            intake_capacity: p.intake_capacity ?? null,
            duration_years: (p as { duration_years?: number | null }).duration_years ?? null,
            seatMatrix: (p.seatMatrix || []).map((s) => ({ category: s.category ?? '', seat_count: s.seat_count ?? null, year: s.year ?? null })),
            previousCutoffs: (p.previousCutoffs || []).map((c) => ({ exam_id: c.exam_id, category: c.category ?? '', cutoff_rank: c.cutoff_rank ?? null, year: c.year ?? null })),
            expectedCutoffs: (p.expectedCutoffs || []).map((c) => ({ exam_id: c.exam_id, category: c.category ?? '', expected_rank: c.expected_rank ?? null, year: c.year ?? null })),
          })),
        });
        setLogoPreview(d.college.college_logo ?? null);
        setEditingCollege(d.college);
        setShowModal(true);
      } else {
        showError('Failed to load college');
      }
    } catch {
      showError('Failed to load college');
    } finally {
      setLoadingView(false);
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
      const response = await deleteCollege(deletingId);
      if (response.success) {
        showSuccess('College deleted');
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
    setEditingCollege(null);
    setFormData({
      college_name: '',
      college_location: '',
      college_type: '',
      college_logo: '',
      college_description: '',
      collegeKeyDates: [],
      collegeDocumentsRequired: [],
      collegeCounsellingProcess: [],
      recommendedExamIds: [],
      collegePrograms: [] as {
        program_id: number;
        intake_capacity: number | null;
        duration_years: number | null;
        seatMatrix: { category: string; seat_count: number | null; year: number | null }[];
        previousCutoffs: { exam_id: number; category: string; cutoff_rank: number | null; year: number | null }[];
        expectedCutoffs: { exam_id: number; category: string; expected_rank: number | null; year: number | null }[];
      }[],
    });
    setLogoPreview(null);
    setError(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCollege(null);
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadCollegesBulkTemplate();
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

  const handleBulkSubmit = async () => {
    if (!bulkExcelFile) {
      showError('Select an Excel file');
      return;
    }
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadColleges(bulkExcelFile, bulkLogoFiles, bulkLogosZipFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} college(s)`);
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

  const handleDeleteAllConfirm = async () => {
    try {
      setIsDeletingAll(true);
      const response = await deleteAllColleges();
      if (response.success) {
        showSuccess(response.message || 'All colleges deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchData(true);
      } else {
        showError(response.message || 'Failed to delete all colleges');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all colleges');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => router.replace('/admin/login')} className="text-pink hover:underline">
            Go to login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Colleges Manager</h1>
            <p className="text-sm text-gray-600">Manage colleges (CRUD and bulk upload, same pattern as Exams).</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                <span className="text-xs font-medium text-gray-700">All colleges</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">{allColleges.length}</span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, or type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90"
              >
                <FiPlus className="h-4 w-4" />
                Add College
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkResult(null);
                  setBulkError(null);
                  setBulkExcelFile(null);
                  setBulkLogoFiles([]);
                  setBulkLogosZipFile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              {currentAdmin?.type === 'super_admin' && (
                <button
                  type="button"
                  onClick={handleDownloadAllExcel}
                  disabled={downloadingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              {currentAdmin?.type === 'super_admin' && allColleges.length > 0 && (
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

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading colleges...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOCATION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {colleges.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {colleges.length < allColleges.length ? 'No colleges match your search' : 'No colleges yet'}
                        </td>
                      </tr>
                    ) : (
                      colleges.map((college) => (
                        <tr key={college.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {college.college_logo ? (
                                <Image src={college.college_logo} alt={college.college_name} width={48} height={48} className="object-contain" unoptimized />
                              ) : (
                                <span className="text-xs text-gray-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{college.college_name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{college.college_location || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            {college.college_type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {college.college_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => handleView(college)} disabled={loadingView} className="p-2 text-gray-600 hover:text-gray-900" title="View">
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleEdit(college)} className="p-2 text-blue-600 hover:text-blue-800" title="Edit">
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => handleDeleteClick(college.id)} className="p-2 text-red-600 hover:text-red-800" title="Delete">
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingCollege ? 'Edit College' : 'Create College'}</h2>
              <button type="button" onClick={handleModalClose} className="text-white hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">College Name *</label>
                <input
                  type="text"
                  value={formData.college_name}
                  onChange={(e) => setFormData({ ...formData, college_name: e.target.value })}
                  required
                  placeholder="e.g. IIT Delhi"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.college_location}
                  onChange={(e) => setFormData({ ...formData, college_location: e.target.value })}
                  placeholder="e.g. New Delhi"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={formData.college_type}
                  onChange={(e) => setFormData({ ...formData, college_type: e.target.value as 'Central' | 'State' | 'Private' | 'Deemed' | '' })}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                >
                  <option value="">Select type</option>
                  <option value="Central">Central</option>
                  <option value="State">State</option>
                  <option value="Private">Private</option>
                  <option value="Deemed">Deemed</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                {logoPreview && (
                  <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-300 mb-2">
                    <Image src={logoPreview} alt="Logo" fill className="object-contain" unoptimized />
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <FiUpload className="h-4 w-4" />
                  <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={uploading} />
                </label>
                {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.college_description}
                  onChange={(e) => setFormData({ ...formData, college_description: e.target.value })}
                  placeholder="Brief description..."
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Key Dates</label>
                {formData.collegeKeyDates.map((k, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Event name"
                      value={k.event_name}
                      onChange={(e) => {
                        const next = [...formData.collegeKeyDates];
                        next[i] = { ...next[i], event_name: e.target.value };
                        setFormData({ ...formData, collegeKeyDates: next });
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="date"
                      value={k.event_date}
                      onChange={(e) => {
                        const next = [...formData.collegeKeyDates];
                        next[i] = { ...next[i], event_date: e.target.value };
                        setFormData({ ...formData, collegeKeyDates: next });
                      }}
                      className="w-36 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <button type="button" onClick={() => setFormData({ ...formData, collegeKeyDates: formData.collegeKeyDates.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, collegeKeyDates: [...formData.collegeKeyDates, { event_name: '', event_date: '' }] })} className="text-sm text-pink hover:underline">+ Add key date</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Documents Required</label>
                {formData.collegeDocumentsRequired.map((d, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Document name"
                      value={d.document_name}
                      onChange={(e) => {
                        const next = [...formData.collegeDocumentsRequired];
                        next[i] = { document_name: e.target.value };
                        setFormData({ ...formData, collegeDocumentsRequired: next });
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <button type="button" onClick={() => setFormData({ ...formData, collegeDocumentsRequired: formData.collegeDocumentsRequired.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, collegeDocumentsRequired: [...formData.collegeDocumentsRequired, { document_name: '' }] })} className="text-sm text-pink hover:underline">+ Add document</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Counselling Process</label>
                {formData.collegeCounsellingProcess.map((c, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input
                      type="number"
                      placeholder="Step"
                      value={c.step_number || ''}
                      onChange={(e) => {
                        const next = [...formData.collegeCounsellingProcess];
                        next[i] = { ...next[i], step_number: parseInt(e.target.value, 10) || 0 };
                        setFormData({ ...formData, collegeCounsellingProcess: next });
                      }}
                      className="w-16 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Description"
                      value={c.description}
                      onChange={(e) => {
                        const next = [...formData.collegeCounsellingProcess];
                        next[i] = { ...next[i], description: e.target.value };
                        setFormData({ ...formData, collegeCounsellingProcess: next });
                      }}
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                    />
                    <button type="button" onClick={() => setFormData({ ...formData, collegeCounsellingProcess: formData.collegeCounsellingProcess.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, collegeCounsellingProcess: [...formData.collegeCounsellingProcess, { step_number: formData.collegeCounsellingProcess.length + 1, description: '' }] })} className="text-sm text-pink hover:underline">+ Add step</button>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Recommended Exams</label>
                <MultiSelect
                  value={formData.recommendedExamIds.map(String)}
                  onChange={(vals) => setFormData({ ...formData, recommendedExamIds: vals.map(Number).filter((n) => !isNaN(n)) })}
                  options={recommendedExamOptions}
                  placeholder="Select exams"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Programs (by name), Intake, Duration, Seat Matrix & Cutoffs</label>
                {formData.collegePrograms.map((p, i) => (
                  <div key={i} className="border border-gray-200 rounded-lg p-3 mb-3 bg-gray-50/50 space-y-2">
                    <div className="flex gap-2 items-center flex-wrap">
                      <select
                        value={p.program_id}
                        onChange={(e) => {
                          const next = [...formData.collegePrograms];
                          next[i] = { ...next[i], program_id: parseInt(e.target.value, 10) };
                          setFormData({ ...formData, collegePrograms: next });
                        }}
                        className="flex-1 min-w-[120px] px-3 py-1.5 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value={0}>Select program</option>
                        {programs.map((prog) => (
                          <option key={prog.id} value={prog.id}>{prog.name}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Intake" value={p.intake_capacity ?? ''} onChange={(e) => {
                        const next = [...formData.collegePrograms];
                        next[i] = { ...next[i], intake_capacity: e.target.value ? parseInt(e.target.value, 10) : null };
                        setFormData({ ...formData, collegePrograms: next });
                      }} className="w-20 px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                      <input type="number" placeholder="Duration (yrs)" value={p.duration_years ?? ''} onChange={(e) => {
                        const next = [...formData.collegePrograms];
                        next[i] = { ...next[i], duration_years: e.target.value ? parseInt(e.target.value, 10) : null };
                        setFormData({ ...formData, collegePrograms: next });
                      }} className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-lg" />
                      <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-sm">Remove</button>
                    </div>
                    <div className="pl-2 text-xs text-gray-600 space-y-1">
                      <span className="font-medium">Seat matrix (category | count | year):</span>
                      {(p.seatMatrix || []).map((s, si) => (
                        <div key={si} className="flex gap-2 items-center flex-wrap">
                          <input type="text" placeholder="Category" value={s.category} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const sm = [...(next[i].seatMatrix || [])];
                            sm[si] = { ...sm[si], category: e.target.value };
                            next[i] = { ...next[i], seatMatrix: sm };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-24 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Seats" value={s.seat_count ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const sm = [...(next[i].seatMatrix || [])];
                            sm[si] = { ...sm[si], seat_count: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], seatMatrix: sm };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-20 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Year" value={s.year ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const sm = [...(next[i].seatMatrix || [])];
                            sm[si] = { ...sm[si], year: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], seatMatrix: sm };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-16 px-2 py-1 text-sm border rounded" />
                          <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, seatMatrix: (pr.seatMatrix || []).filter((_, k) => k !== si) } : pr) })} className="text-red-500 text-xs">Del</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, seatMatrix: [...(pr.seatMatrix || []), { category: '', seat_count: null, year: null }] } : pr) })} className="text-pink text-xs">+ Seat row</button>
                    </div>
                    <div className="pl-2 text-xs text-gray-600 space-y-1">
                      <span className="font-medium">Previous year cutoff (exam | category | rank | year):</span>
                      {(p.previousCutoffs || []).map((c, ci) => (
                        <div key={ci} className="flex gap-2 items-center flex-wrap">
                          <select value={c.exam_id} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const pc = [...(next[i].previousCutoffs || [])];
                            pc[ci] = { ...pc[ci], exam_id: parseInt(e.target.value, 10) };
                            next[i] = { ...next[i], previousCutoffs: pc };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="min-w-[120px] px-2 py-1 text-sm border rounded">
                            <option value={0}>Exam</option>
                            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
                          </select>
                          <input type="text" placeholder="Category" value={c.category} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const pc = [...(next[i].previousCutoffs || [])];
                            pc[ci] = { ...pc[ci], category: e.target.value };
                            next[i] = { ...next[i], previousCutoffs: pc };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-20 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Rank" value={c.cutoff_rank ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const pc = [...(next[i].previousCutoffs || [])];
                            pc[ci] = { ...pc[ci], cutoff_rank: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], previousCutoffs: pc };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-20 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Year" value={c.year ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const pc = [...(next[i].previousCutoffs || [])];
                            pc[ci] = { ...pc[ci], year: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], previousCutoffs: pc };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-16 px-2 py-1 text-sm border rounded" />
                          <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, previousCutoffs: (pr.previousCutoffs || []).filter((_, k) => k !== ci) } : pr) })} className="text-red-500 text-xs">Del</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, previousCutoffs: [...(pr.previousCutoffs || []), { exam_id: 0, category: '', cutoff_rank: null, year: null }] } : pr) })} className="text-pink text-xs">+ Previous cutoff</button>
                    </div>
                    <div className="pl-2 text-xs text-gray-600 space-y-1">
                      <span className="font-medium">Expected cutoff (exam | category | rank | year):</span>
                      {(p.expectedCutoffs || []).map((c, ci) => (
                        <div key={ci} className="flex gap-2 items-center flex-wrap">
                          <select value={c.exam_id} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const ec = [...(next[i].expectedCutoffs || [])];
                            ec[ci] = { ...ec[ci], exam_id: parseInt(e.target.value, 10) };
                            next[i] = { ...next[i], expectedCutoffs: ec };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="min-w-[120px] px-2 py-1 text-sm border rounded">
                            <option value={0}>Exam</option>
                            {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.exam_name}</option>)}
                          </select>
                          <input type="text" placeholder="Category" value={c.category} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const ec = [...(next[i].expectedCutoffs || [])];
                            ec[ci] = { ...ec[ci], category: e.target.value };
                            next[i] = { ...next[i], expectedCutoffs: ec };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-20 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Rank" value={c.expected_rank ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const ec = [...(next[i].expectedCutoffs || [])];
                            ec[ci] = { ...ec[ci], expected_rank: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], expectedCutoffs: ec };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-20 px-2 py-1 text-sm border rounded" />
                          <input type="number" placeholder="Year" value={c.year ?? ''} onChange={(e) => {
                            const next = [...formData.collegePrograms];
                            const ec = [...(next[i].expectedCutoffs || [])];
                            ec[ci] = { ...ec[ci], year: e.target.value ? parseInt(e.target.value, 10) : null };
                            next[i] = { ...next[i], expectedCutoffs: ec };
                            setFormData({ ...formData, collegePrograms: next });
                          }} className="w-16 px-2 py-1 text-sm border rounded" />
                          <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, expectedCutoffs: (pr.expectedCutoffs || []).filter((_, k) => k !== ci) } : pr) })} className="text-red-500 text-xs">Del</button>
                        </div>
                      ))}
                      <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, expectedCutoffs: [...(pr.expectedCutoffs || []), { exam_id: 0, category: '', expected_rank: null, year: null }] } : pr) })} className="text-pink text-xs">+ Expected cutoff</button>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: [...formData.collegePrograms, { program_id: 0, intake_capacity: null, duration_years: null, seatMatrix: [], previousCutoffs: [], expectedCutoffs: [] }] })} className="text-sm text-pink hover:underline">+ Add program</button>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleModalClose} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50">
                  {isSaving ? 'Saving...' : editingCollege ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal – all college details */}
      {viewingData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-start gap-3 min-w-0">
                {viewingData.college_logo && (
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                    <Image src={viewingData.college_logo} alt="" width={56} height={56} className="h-full w-full object-contain" unoptimized />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-gray-900">{viewingData.college_name}</h2>
                  <p className="text-sm text-gray-600"><strong>Location:</strong> {viewingData.college_location || '-'}</p>
                  <p className="text-sm text-gray-600"><strong>Type:</strong> {viewingData.college_type || '-'}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewingData(null)} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {viewingData.collegeDetails?.college_description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-1">Description</h3>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{viewingData.collegeDetails.college_description}</p>
              </div>
            )}

            {((viewingData.collegeKeyDates ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Key Dates</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {(viewingData.collegeKeyDates ?? []).map((k, i) => (
                    <li key={i}>{k.event_name || 'Event'}{k.event_date ? ` — ${String(k.event_date).slice(0, 10)}` : ''}</li>
                  ))}
                </ul>
              </div>
            )}

            {((viewingData.collegeDocumentsRequired ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Documents Required</h3>
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {(viewingData.collegeDocumentsRequired ?? []).map((d, i) => (
                    <li key={i}>{d.document_name || '-'}</li>
                  ))}
                </ul>
              </div>
            )}

            {((viewingData.collegeCounsellingProcess ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Counselling Process</h3>
                <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                  {(viewingData.collegeCounsellingProcess ?? [])
                    .slice()
                    .sort((a, b) => (a.step_number ?? 0) - (b.step_number ?? 0))
                    .map((c, i) => (
                      <li key={i}>{c.description || `Step ${c.step_number ?? i + 1}`}</li>
                    ))}
                </ol>
              </div>
            )}

            {((viewingData.recommendedExamIds ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Recommended Exams</h3>
                <p className="text-sm text-gray-700">
                  {(viewingData.recommendedExamIds ?? [])
                    .map((eid) => exams.find((e) => e.id === eid)?.exam_name ?? `ID ${eid}`)
                    .join(', ') || '-'}
                </p>
              </div>
            )}

            {((viewingData.collegePrograms ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Programs</h3>
                <div className="space-y-3">
                  {(viewingData.collegePrograms ?? []).map((p, i) => (
                    <div key={i} className="border border-gray-200 rounded-lg p-3 bg-gray-50/50">
                      <p className="text-sm font-medium text-gray-800">
                        {programs.find((pr) => pr.id === p.program_id)?.name ?? `Program #${p.program_id}`}
                        {(p as { duration_years?: number | null }).duration_years != null && (
                          <span className="text-gray-600 font-normal"> — {p.duration_years} yr(s)</span>
                        )}
                        {p.intake_capacity != null && (
                          <span className="text-gray-600 font-normal"> — Intake: {p.intake_capacity}</span>
                        )}
                      </p>
                      {(p.seatMatrix?.length ?? 0) > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Seat matrix: {(p.seatMatrix ?? []).map((s) => `${s.category ?? '-'}: ${s.seat_count ?? '-'} (${s.year ?? '-'})`).join('; ')}
                        </p>
                      )}
                      {(p.previousCutoffs?.length ?? 0) > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Previous cutoff: {(p.previousCutoffs ?? []).map((c) => `${exams.find((e) => e.id === c.exam_id)?.exam_name ?? c.exam_id} ${c.category ?? ''} rank ${c.cutoff_rank ?? '-'} (${c.year ?? '-'})`).join('; ')}
                        </p>
                      )}
                      {(p.expectedCutoffs?.length ?? 0) > 0 && (
                        <p className="text-xs text-gray-600 mt-1">
                          Expected cutoff: {(p.expectedCutoffs ?? []).map((c) => `${exams.find((e) => e.id === c.exam_id)?.exam_name ?? c.exam_id} ${c.category ?? ''} rank ${c.expected_rank ?? '-'} (${c.year ?? '-'})`).join('; ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-200">
              <button type="button" onClick={() => setViewingData(null)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
              <button type="button" onClick={() => { setViewingData(null); handleEdit(viewingData); }} className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bulk Upload Colleges</h2>
              <button type="button" onClick={() => { setShowBulkModal(false); }} className="text-gray-500 hover:text-gray-700">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (use template). Optionally attach a ZIP of logos; filenames must match the <code className="bg-gray-100 px-1 rounded">logo_filename</code> column.
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Excel file *</label>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Logos (ZIP file)</label>
                <input
                  type="file"
                  accept=".zip"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file?.name.toLowerCase().endsWith('.zip')) {
                      setBulkLogosZipFile(file);
                      setBulkLogoFiles([]);
                    }
                    e.target.value = '';
                  }}
                  className="w-full text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleBulkTemplateDownload}
                className="inline-flex items-center gap-2 text-sm text-pink hover:underline"
              >
                <FiDownload className="h-4 w-4" />
                Download Excel template
              </button>
            </div>
            {bulkError && <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{bulkError}</div>}
            {bulkResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Created: {bulkResult.created}. {bulkResult.errors > 0 && `Errors: ${bulkResult.errors} row(s).`}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
                Close
              </button>
              <button type="button" onClick={handleBulkSubmit} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50">
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
        title="Delete College"
        message="Are you sure you want to delete this college? All related data will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Colleges"
        message={`Are you sure you want to delete all ${allColleges.length} colleges? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
        confirmButtonStyle="danger"
      />
    </div>
  );
}
