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
  uploadMissingLogosColleges,
  deleteAllColleges,
  type College,
  type CollegeWithDetails,
} from '@/api/admin/colleges';
import { getAllPrograms, type Program } from '@/api/admin/programs';
import { getAllExamsAdmin, type Exam } from '@/api/admin/exams';
import { getAllBranches, type Branch } from '@/api/admin/branches';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiDownload, FiFile, FiImage } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect, Dropdown } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
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
  const emptyProgram = {
    program_id: 0,
    branch_course: '',
    program_description: '',
    duration_unit: 'years',
    duration_years: null as number | null,
    intake_capacity: null as number | null,
    key_dates_summary: '',
    fee_per_semester: null as number | null,
    total_fee: null as number | null,
    counselling_process: '',
    documents_required: '',
    placement: '',
    scholarship: '',
    recommended_exam_ids: [] as number[],
    contact_email: '',
    contact_number: '',
    brochure_url: '',
    seatMatrix: [] as { branch: string; category: string; seat_count: number | null; year: number | null }[],
    previousCutoffs: [] as { exam_id: number; branch?: string; category: string; cutoff_rank: number | null; year: number | null }[],
    expectedCutoffs: [] as { exam_id: number; branch?: string; category: string; expected_rank: number | null; year: number | null }[],
  };
  const [formData, setFormData] = useState({
    college_name: '',
    college_location: '',
    google_map_link: '',
    college_type: [] as string[],
    major_program_ids: [] as number[],
    website: '',
    college_logo: '',
    logo_filename: '',
    college_description: '',
    collegePrograms: [{ ...emptyProgram }] as (typeof emptyProgram)[],
  });
  const [programs, setPrograms] = useState<Program[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
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
  const { canDownloadExcel } = useAdminPermissions();
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ type?: string } | null>(null);
  const [showMissingLogosModal, setShowMissingLogosModal] = useState(false);
  const [missingLogosZipFile, setMissingLogosZipFile] = useState<File | null>(null);
  const [missingLogosUploading, setMissingLogosUploading] = useState(false);
  const [missingLogosError, setMissingLogosError] = useState<string | null>(null);
  const [missingLogosResult, setMissingLogosResult] = useState<{ updated: { id: number; college_name: string }[]; skipped: string[]; summary: { logosAdded: number; filesSkipped: number; uploadErrors: number } } | null>(null);

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
        const [progRes, branchesRes, examRes] = await Promise.all([getAllPrograms(), getAllBranches(), getAllExamsAdmin()]);
        if (progRes.success && progRes.data?.programs) setPrograms(progRes.data.programs);
        if (branchesRes.success && branchesRes.data?.branches) setBranches(branchesRes.data.branches.filter((b: Branch) => b.status));
        if (examRes.success && examRes.data?.exams) {
          setExams(examRes.data.exams);
          setRecommendedExamOptions(examRes.data.exams.map((e) => ({ value: String(e.id), label: e.name || String(e.id) })));
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
      const payload = {
        college_name: formData.college_name.trim(),
        college_location: formData.college_location.trim() || null,
        google_map_link: formData.google_map_link.trim() || null,
        college_type: formData.college_type.length > 0 ? formData.college_type.join(',') : null,
        major_program_ids: formData.major_program_ids,
        website: formData.website.trim() || null,
        college_logo: formData.college_logo || null,
        logo_filename: formData.logo_filename.trim() || null,
        college_description: formData.college_description.trim() || null,
        collegePrograms: formData.collegePrograms.filter((p) => p.program_id).map((p) => ({
          program_id: p.program_id,
          branch_course: p.branch_course?.trim() || null,
          program_description: p.program_description?.trim() || null,
          duration_unit: p.duration_unit || 'years',
          duration_years: p.duration_years ?? null,
          intake_capacity: p.intake_capacity,
          key_dates_summary: p.key_dates_summary?.trim() || null,
          fee_per_semester: p.fee_per_semester ?? null,
          total_fee: p.total_fee ?? null,
          counselling_process: p.counselling_process?.trim() || null,
          documents_required: p.documents_required?.trim() || null,
          placement: p.placement?.trim() || null,
          scholarship: p.scholarship?.trim() || null,
          recommended_exam_ids: p.recommended_exam_ids.length > 0 ? p.recommended_exam_ids.join(',') : null,
          contact_email: p.contact_email?.trim() || null,
          contact_number: p.contact_number?.trim() || null,
          brochure_url: p.brochure_url?.trim() || null,
          seatMatrix: (p.seatMatrix || []).filter((s) => s.branch?.trim() || s.category?.trim() || s.seat_count != null || s.year != null).map((s) => ({ branch: s.branch || undefined, category: s.category || undefined, seat_count: s.seat_count ?? undefined, year: s.year ?? undefined })),
          previousCutoffs: (p.previousCutoffs || []).filter((c) => c.exam_id).map((c) => ({ exam_id: c.exam_id, branch: (c as { branch?: string }).branch || undefined, category: c.category || undefined, cutoff_rank: c.cutoff_rank ?? undefined, year: c.year ?? undefined })),
          expectedCutoffs: (p.expectedCutoffs || []).filter((c) => c.exam_id).map((c) => ({ exam_id: c.exam_id, branch: (c as { branch?: string }).branch || undefined, category: c.category || undefined, expected_rank: c.expected_rank ?? undefined, year: c.year ?? undefined })),
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
        const typeStr = d.college.college_type ?? '';
        const typeArr = typeStr ? typeStr.split(',').map((s: string) => s.trim()).filter(Boolean) : [];
        const majorIdsStr = d.collegeDetails?.major_program_ids ?? '';
        const majorIds = majorIdsStr ? majorIdsStr.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n)) : [];
        setFormData({
          college_name: d.college.college_name ?? '',
          college_location: d.college.college_location ?? '',
          google_map_link: d.college.google_map_link ?? '',
          college_type: typeArr,
          major_program_ids: majorIds,
          website: d.college.website ?? '',
          college_logo: d.college.college_logo ?? '',
          logo_filename: d.college.logo_filename ?? '',
          college_description: d.collegeDetails?.college_description ?? '',
          collegePrograms: (d.collegePrograms || []).length > 0 ? (d.collegePrograms || []).map((p) => ({
            program_id: p.program_id,
            branch_course: p.branch_course ?? '',
            program_description: p.program_description ?? '',
            duration_unit: p.duration_unit ?? 'years',
            duration_years: p.duration_years ?? null,
            intake_capacity: p.intake_capacity ?? null,
            key_dates_summary: p.key_dates_summary ?? '',
            fee_per_semester: p.fee_per_semester != null ? Number(p.fee_per_semester) : null,
            total_fee: p.total_fee != null ? Number(p.total_fee) : null,
            counselling_process: p.counselling_process ?? '',
            documents_required: p.documents_required ?? '',
            placement: p.placement ?? '',
            scholarship: p.scholarship ?? '',
            recommended_exam_ids: p.recommended_exam_ids ? p.recommended_exam_ids.split(',').map((s: string) => parseInt(s.trim(), 10)).filter((n: number) => !isNaN(n)) : [],
            contact_email: p.contact_email ?? '',
            contact_number: p.contact_number ?? '',
            brochure_url: p.brochure_url ?? '',
            seatMatrix: (p.seatMatrix || []).map((s) => ({ branch: (s as { branch?: string }).branch ?? '', category: s.category ?? '', seat_count: s.seat_count ?? null, year: s.year ?? null })),
            previousCutoffs: (p.previousCutoffs || []).map((c) => ({ exam_id: c.exam_id ?? 0, branch: (c as { branch?: string }).branch ?? '', category: c.category ?? '', cutoff_rank: c.cutoff_rank ?? null, year: c.year ?? null })),
            expectedCutoffs: (p.expectedCutoffs || []).map((c) => ({ exam_id: c.exam_id ?? 0, branch: (c as { branch?: string }).branch ?? '', category: c.category ?? '', expected_rank: c.expected_rank ?? null, year: c.year ?? null })),
          })) : [{ ...emptyProgram }],
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
      google_map_link: '',
      college_type: [],
      major_program_ids: [],
      website: '',
      college_logo: '',
      logo_filename: '',
      college_description: '',
      collegePrograms: [{ ...emptyProgram }],
    });
    setLogoPreview(null);
    setError(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCollege(null);
  };

  const handleMissingLogosSubmit = async () => {
    if (!missingLogosZipFile) {
      showError('Please select a ZIP file');
      return;
    }
    setMissingLogosUploading(true);
    setMissingLogosError(null);
    setMissingLogosResult(null);
    try {
      const res = await uploadMissingLogosColleges(missingLogosZipFile);
      if (res.success && res.data) {
        setMissingLogosResult(res.data);
        showSuccess(res.message || `Added ${res.data.summary.logosAdded} logo(s)`);
        fetchData(true);
      } else {
        setMissingLogosError(res.message || 'Upload failed');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setMissingLogosError(msg);
      showError(msg);
    } finally {
      setMissingLogosUploading(false);
    }
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
            <h1 className="text-xl font-bold text-slate-900 mb-1">Colleges Manager</h1>
            <p className="text-sm text-slate-600">Manage colleges (CRUD and bulk upload, same pattern as Exams).</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button type="button" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">
                <span className="text-xs font-medium text-slate-700">All colleges</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{allColleges.length}</span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, or type"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64"
                />
              </div>
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90"
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
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              {allColleges.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowMissingLogosModal(true);
                    setMissingLogosZipFile(null);
                    setMissingLogosResult(null);
                    setMissingLogosError(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA]"
                >
                  <FiUpload className="h-4 w-4" />
                  Upload missing logos
                </button>
              )}
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

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading colleges...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">LOCATION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {colleges.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                          {colleges.length < allColleges.length ? 'No colleges match your search' : 'No colleges yet'}
                        </td>
                      </tr>
                    ) : (
                      colleges.map((college) => (
                        <tr key={college.id} className="hover:bg-[#F6F8FA]">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                              {college.college_logo ? (
                                <Image src={college.college_logo} alt={college.college_name} width={48} height={48} className="object-contain" unoptimized />
                              ) : (
                                <span className="text-xs text-slate-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-slate-900">{college.college_name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-slate-600">{college.college_location || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            {college.college_type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {college.college_type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(college)}
                              onEdit={() => handleEdit(college)}
                              onDelete={() => handleDeleteClick(college.id)}
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
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingCollege ? 'Edit College' : 'Create College'}</h2>
              <button type="button" onClick={handleModalClose} className="text-slate-500 hover:text-slate-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4 space-y-4">
              {/* ── College Details ── */}
              <div className="border-b border-slate-200 pb-1 mb-2">
                <h3 className="text-sm font-bold text-slate-800">College Details</h3>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">College Name *</label>
                <input type="text" value={formData.college_name} onChange={(e) => setFormData({ ...formData, college_name: e.target.value })} required placeholder="e.g. IIT Delhi" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Location</label>
                <input type="text" value={formData.college_location} onChange={(e) => setFormData({ ...formData, college_location: e.target.value })} placeholder="e.g. New Delhi" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Google Map Link</label>
                <input type="url" value={formData.google_map_link} onChange={(e) => setFormData({ ...formData, google_map_link: e.target.value })} placeholder="https://maps.google.com/..." className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">College Type (multiple)</label>
                <MultiSelect
                  value={formData.college_type}
                  onChange={(vals) => setFormData({ ...formData, college_type: vals })}
                  options={[
                    { value: 'Central', label: 'Central' },
                    { value: 'State', label: 'State' },
                    { value: 'Private', label: 'Private' },
                    { value: 'Deemed', label: 'Deemed' },
                  ]}
                  placeholder="Select type(s)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Major Programs Offered</label>
                <MultiSelect
                  value={formData.major_program_ids.map(String)}
                  onChange={(vals) => setFormData({ ...formData, major_program_ids: vals.map(Number).filter((n) => !isNaN(n)) })}
                  options={programs.map((p) => ({ value: String(p.id), label: p.name }))}
                  placeholder="Select programs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} placeholder="https://www.college.ac.in" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Logo</label>
                {logoPreview && (
                  <div className="relative h-24 w-24 rounded-md overflow-hidden bg-slate-100 border border-slate-300 mb-2">
                    <Image src={logoPreview} alt="Logo" fill className="object-contain" unoptimized />
                  </div>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA] cursor-pointer">
                  <FiUpload className="h-4 w-4" />
                  <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" disabled={uploading} />
                </label>
                {uploading && <p className="text-xs text-slate-500 mt-1">Uploading...</p>}
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Logo file name</label>
                <input
                  type="text"
                  value={formData.logo_filename}
                  onChange={(e) => setFormData({ ...formData, logo_filename: e.target.value })}
                  placeholder="e.g. iit_delhi.png"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Used to match files when using &quot;Upload missing logos&quot; (ZIP file names must match this).</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea value={formData.college_description} onChange={(e) => setFormData({ ...formData, college_description: e.target.value })} placeholder="Brief description..." rows={3} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-none" />
              </div>

              {/* ── Program Details ── */}
              <div className="border-b border-slate-200 pb-1 mb-2 mt-6">
                <h3 className="text-sm font-bold text-slate-800">Program Details</h3>
              </div>
              {formData.collegePrograms.map((p, i) => (
                <div key={i} className="border border-slate-200 rounded-lg p-3 mb-3 bg-[#F6F8FA]/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Program {i + 1}</span>
                    {formData.collegePrograms.length > 1 && (
                      <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.filter((_, j) => j !== i) })} className="text-red-600 hover:text-red-800 text-xs">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-0.5">Program Category *</label>
                      <Dropdown<number> value={p.program_id} onChange={(v) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], program_id: v }; setFormData({ ...formData, collegePrograms: next }); }} options={[{ value: 0, label: 'Select program category' }, ...programs.map((prog) => ({ value: prog.id, label: prog.name }))]} placeholder="Select program category" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-0.5">Branch / Course</label>
                      <Dropdown<string>
                        value={p.branch_course || null}
                        onChange={(v) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], branch_course: v ?? '' }; setFormData({ ...formData, collegePrograms: next }); }}
                        options={[{ value: '', label: 'Select branch/course' }, ...branches.map((b) => ({ value: b.name, label: b.name }))]}
                        placeholder="Select branch/course"
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-0.5">Program Description</label>
                    <textarea value={p.program_description} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], program_description: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="Brief program description..." rows={2} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg resize-none" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-slate-600 mb-0.5">Duration Unit</label>
                      <Dropdown value={p.duration_unit} onChange={(v) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], duration_unit: v }; setFormData({ ...formData, collegePrograms: next }); }} options={[{ value: 'years', label: 'Years' }, { value: 'months', label: 'Months' }, { value: 'semesters', label: 'Semesters' }]} placeholder="Unit" className="w-full" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-0.5">Duration</label>
                      <input type="number" placeholder="e.g. 4" value={p.duration_years ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], duration_years: e.target.value ? parseInt(e.target.value, 10) : null }; setFormData({ ...formData, collegePrograms: next }); }} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-600 mb-0.5">Intake Capacity</label>
                      <input type="number" placeholder="e.g. 120" value={p.intake_capacity ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], intake_capacity: e.target.value ? parseInt(e.target.value, 10) : null }; setFormData({ ...formData, collegePrograms: next }); }} className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                    </div>
                  </div>

                  {/* Previous Cutoff */}
                  <div className="pl-2 text-xs text-slate-600 space-y-1">
                    <span className="font-medium">Previous Years Cutoff:</span>
                    {(p.previousCutoffs || []).map((c, ci) => (
                      <div key={ci} className="flex gap-2 items-center flex-wrap">
                        <Dropdown<number> value={c.exam_id} onChange={(v) => { const next = [...formData.collegePrograms]; const pc = [...(next[i].previousCutoffs || [])]; pc[ci] = { ...pc[ci], exam_id: v }; next[i] = { ...next[i], previousCutoffs: pc }; setFormData({ ...formData, collegePrograms: next }); }} options={[{ value: 0, label: 'Exam' }, ...exams.map((ex) => ({ value: ex.id, label: ex.name }))]} placeholder="Exam" size="sm" className="min-w-[120px]" />
                        <input type="text" placeholder="Branch" value={(c as { branch?: string }).branch ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const pc = [...(next[i].previousCutoffs || [])]; pc[ci] = { ...pc[ci], branch: e.target.value }; next[i] = { ...next[i], previousCutoffs: pc }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="text" placeholder="Category" value={c.category} onChange={(e) => { const next = [...formData.collegePrograms]; const pc = [...(next[i].previousCutoffs || [])]; pc[ci] = { ...pc[ci], category: e.target.value }; next[i] = { ...next[i], previousCutoffs: pc }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Rank" value={c.cutoff_rank ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const pc = [...(next[i].previousCutoffs || [])]; pc[ci] = { ...pc[ci], cutoff_rank: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], previousCutoffs: pc }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Year" value={c.year ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const pc = [...(next[i].previousCutoffs || [])]; pc[ci] = { ...pc[ci], year: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], previousCutoffs: pc }; setFormData({ ...formData, collegePrograms: next }); }} className="w-16 px-2 py-1 text-sm border rounded" />
                        <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, previousCutoffs: (pr.previousCutoffs || []).filter((_, k) => k !== ci) } : pr) })} className="text-red-500 text-xs">Del</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, previousCutoffs: [...(pr.previousCutoffs || []), { exam_id: 0, branch: '', category: '', cutoff_rank: null, year: null }] } : pr) })} className="text-[#341050] text-xs">+ Previous cutoff</button>
                  </div>

                  {/* Expected Cutoff */}
                  <div className="pl-2 text-xs text-slate-600 space-y-1">
                    <span className="font-medium">Expected Cutoff Range:</span>
                    {(p.expectedCutoffs || []).map((c, ci) => (
                      <div key={ci} className="flex gap-2 items-center flex-wrap">
                        <Dropdown<number> value={c.exam_id} onChange={(v) => { const next = [...formData.collegePrograms]; const ec = [...(next[i].expectedCutoffs || [])]; ec[ci] = { ...ec[ci], exam_id: v }; next[i] = { ...next[i], expectedCutoffs: ec }; setFormData({ ...formData, collegePrograms: next }); }} options={[{ value: 0, label: 'Exam' }, ...exams.map((ex) => ({ value: ex.id, label: ex.name }))]} placeholder="Exam" size="sm" className="min-w-[120px]" />
                        <input type="text" placeholder="Branch" value={(c as { branch?: string }).branch ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const ec = [...(next[i].expectedCutoffs || [])]; ec[ci] = { ...ec[ci], branch: e.target.value }; next[i] = { ...next[i], expectedCutoffs: ec }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="text" placeholder="Category" value={c.category} onChange={(e) => { const next = [...formData.collegePrograms]; const ec = [...(next[i].expectedCutoffs || [])]; ec[ci] = { ...ec[ci], category: e.target.value }; next[i] = { ...next[i], expectedCutoffs: ec }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Rank" value={c.expected_rank ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const ec = [...(next[i].expectedCutoffs || [])]; ec[ci] = { ...ec[ci], expected_rank: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], expectedCutoffs: ec }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Year" value={c.year ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const ec = [...(next[i].expectedCutoffs || [])]; ec[ci] = { ...ec[ci], year: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], expectedCutoffs: ec }; setFormData({ ...formData, collegePrograms: next }); }} className="w-16 px-2 py-1 text-sm border rounded" />
                        <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, expectedCutoffs: (pr.expectedCutoffs || []).filter((_, k) => k !== ci) } : pr) })} className="text-red-500 text-xs">Del</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, expectedCutoffs: [...(pr.expectedCutoffs || []), { exam_id: 0, branch: '', category: '', expected_rank: null, year: null }] } : pr) })} className="text-[#341050] text-xs">+ Expected cutoff</button>
                  </div>

                  {/* Key Dates */}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <span className="text-xs font-bold text-slate-700">Key Dates</span>
                    <div className="mt-1">
                      <label className="block text-xs text-slate-600 mb-0.5">Summary</label>
                      <input type="text" value={p.key_dates_summary} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], key_dates_summary: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. Admissions start Jan 2025, Last date Feb 2025" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                    </div>
                  </div>

                  {/* Fee Details */}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <span className="text-xs font-bold text-slate-700">Fee Details</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Fee per Semester (₹)</label>
                        <input type="number" value={p.fee_per_semester ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], fee_per_semester: e.target.value ? parseFloat(e.target.value) : null }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. 150000" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Total Fee (₹)</label>
                        <input type="number" value={p.total_fee ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], total_fee: e.target.value ? parseFloat(e.target.value) : null }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. 600000" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                    </div>
                  </div>

                  {/* Other Information */}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <span className="text-xs font-bold text-slate-700">Other Information</span>
                    <div className="space-y-2 mt-1">
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Counselling Process</label>
                        <input type="text" value={p.counselling_process} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], counselling_process: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. JOSAA counselling" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Documents Required</label>
                        <input type="text" value={p.documents_required} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], documents_required: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. Aadhar, Marksheet, Photo" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Placement</label>
                        <input type="text" value={p.placement} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], placement: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. Average 12 LPA" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Scholarship</label>
                        <input type="text" value={p.scholarship} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], scholarship: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. Merit-based scholarship available" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Recommended Exams</label>
                        <MultiSelect
                          value={p.recommended_exam_ids.map(String)}
                          onChange={(vals) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], recommended_exam_ids: vals.map(Number).filter((n) => !isNaN(n)) }; setFormData({ ...formData, collegePrograms: next }); }}
                          options={recommendedExamOptions}
                          placeholder="Select exams"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="border-t border-slate-200 pt-2 mt-2">
                    <span className="text-xs font-bold text-slate-700">Contact Information</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Email ID</label>
                        <input type="email" value={p.contact_email} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], contact_email: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="admissions@college.ac.in" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-600 mb-0.5">Contact Number</label>
                        <input type="text" value={p.contact_number} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], contact_number: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="e.g. 011-12345678" className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                      </div>
                    </div>
                    <div className="mt-2">
                      <label className="block text-xs text-slate-600 mb-0.5">Brochure URL</label>
                      <input type="url" value={p.brochure_url} onChange={(e) => { const next = [...formData.collegePrograms]; next[i] = { ...next[i], brochure_url: e.target.value }; setFormData({ ...formData, collegePrograms: next }); }} placeholder="https://..." className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg" />
                    </div>
                  </div>

                  {/* Seat Matrix */}
                  <div className="pl-2 text-xs text-slate-600 space-y-1 border-t border-slate-200 pt-2 mt-2">
                    <span className="font-medium">Seat Matrix:</span>
                    {(p.seatMatrix || []).map((s, si) => (
                      <div key={si} className="flex gap-2 items-center flex-wrap">
                        <input type="text" placeholder="Branch" value={s.branch} onChange={(e) => { const next = [...formData.collegePrograms]; const sm = [...(next[i].seatMatrix || [])]; sm[si] = { ...sm[si], branch: e.target.value }; next[i] = { ...next[i], seatMatrix: sm }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="text" placeholder="Category" value={s.category} onChange={(e) => { const next = [...formData.collegePrograms]; const sm = [...(next[i].seatMatrix || [])]; sm[si] = { ...sm[si], category: e.target.value }; next[i] = { ...next[i], seatMatrix: sm }; setFormData({ ...formData, collegePrograms: next }); }} className="w-24 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Seats" value={s.seat_count ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const sm = [...(next[i].seatMatrix || [])]; sm[si] = { ...sm[si], seat_count: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], seatMatrix: sm }; setFormData({ ...formData, collegePrograms: next }); }} className="w-20 px-2 py-1 text-sm border rounded" />
                        <input type="number" placeholder="Year" value={s.year ?? ''} onChange={(e) => { const next = [...formData.collegePrograms]; const sm = [...(next[i].seatMatrix || [])]; sm[si] = { ...sm[si], year: e.target.value ? parseInt(e.target.value, 10) : null }; next[i] = { ...next[i], seatMatrix: sm }; setFormData({ ...formData, collegePrograms: next }); }} className="w-16 px-2 py-1 text-sm border rounded" />
                        <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, seatMatrix: (pr.seatMatrix || []).filter((_, k) => k !== si) } : pr) })} className="text-red-500 text-xs">Del</button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: formData.collegePrograms.map((pr, j) => j === i ? { ...pr, seatMatrix: [...(pr.seatMatrix || []), { branch: '', category: '', seat_count: null, year: null }] } : pr) })} className="text-[#341050] text-xs">+ Seat row</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={() => setFormData({ ...formData, collegePrograms: [...formData.collegePrograms, { ...emptyProgram }] })} className="text-sm text-[#341050] hover:underline">+ Add program</button>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={handleModalClose} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">Cancel</button>
                <button type="submit" disabled={isSaving} className="px-3 py-1.5 text-sm bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 disabled:opacity-50">{isSaving ? 'Saving...' : editingCollege ? 'Update' : 'Create'}</button>
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
                  <div className="h-14 w-14 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                    <Image src={viewingData.college_logo} alt="" width={56} height={56} className="h-full w-full object-contain" unoptimized />
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-slate-900">{viewingData.college_name}</h2>
                  <p className="text-sm text-slate-600"><strong>Location:</strong> {viewingData.college_location || '-'}</p>
                  <p className="text-sm text-slate-600"><strong>Type:</strong> {viewingData.college_type || '-'}</p>
                  {viewingData.google_map_link && <p className="text-sm text-slate-600"><strong>Map:</strong> <a href={viewingData.google_map_link} target="_blank" rel="noopener noreferrer" className="text-[#341050] hover:underline">View on Google Maps</a></p>}
                  {viewingData.website && <p className="text-sm text-slate-600"><strong>Website:</strong> <a href={viewingData.website} target="_blank" rel="noopener noreferrer" className="text-[#341050] hover:underline">{viewingData.website}</a></p>}
                  {viewingData.logo_filename && <p className="text-sm text-slate-600"><strong>Logo file name:</strong> <code className="px-1 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-xs">{viewingData.logo_filename}</code></p>}
                </div>
              </div>
              <button type="button" onClick={() => setViewingData(null)} className="text-slate-500 hover:text-slate-700 flex-shrink-0">
                <FiX className="h-5 w-5" />
              </button>
            </div>

            {viewingData.collegeDetails?.college_description && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Description</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{viewingData.collegeDetails.college_description}</p>
              </div>
            )}

            {viewingData.collegeDetails?.major_program_ids && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-1">Major Programs Offered</h3>
                <p className="text-sm text-slate-700">
                  {viewingData.collegeDetails.major_program_ids.split(',').map((id) => {
                    const pid = parseInt(id.trim(), 10);
                    return programs.find((pr) => pr.id === pid)?.name ?? `ID ${pid}`;
                  }).join(', ')}
                </p>
              </div>
            )}

            {((viewingData.collegePrograms ?? []).length > 0) && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Programs</h3>
                <div className="space-y-3">
                  {(viewingData.collegePrograms ?? []).map((p, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 bg-[#F6F8FA]/50 space-y-1">
                      <p className="text-sm font-medium text-slate-800">
                        {programs.find((pr) => pr.id === p.program_id)?.name ?? `Program #${p.program_id}`}
                        {p.branch_course && <span className="text-slate-600 font-normal"> — {p.branch_course}</span>}
                      </p>
                      {p.program_description && <p className="text-xs text-slate-600">{p.program_description}</p>}
                      <p className="text-xs text-slate-600">
                        {p.duration_years != null && <span>Duration: {p.duration_years} {p.duration_unit || 'years'} · </span>}
                        {p.intake_capacity != null && <span>Intake: {p.intake_capacity}</span>}
                      </p>
                      {p.key_dates_summary && <p className="text-xs text-slate-600"><strong>Key Dates:</strong> {p.key_dates_summary}</p>}
                      {(p.fee_per_semester != null || p.total_fee != null) && <p className="text-xs text-slate-600"><strong>Fee:</strong> {p.fee_per_semester != null && `₹${Number(p.fee_per_semester).toLocaleString()}/sem`}{p.fee_per_semester != null && p.total_fee != null && ' · '}{p.total_fee != null && `Total ₹${Number(p.total_fee).toLocaleString()}`}</p>}
                      {p.counselling_process && <p className="text-xs text-slate-600"><strong>Counselling:</strong> {p.counselling_process}</p>}
                      {p.documents_required && <p className="text-xs text-slate-600"><strong>Documents:</strong> {p.documents_required}</p>}
                      {p.placement && <p className="text-xs text-slate-600"><strong>Placement:</strong> {p.placement}</p>}
                      {p.scholarship && <p className="text-xs text-slate-600"><strong>Scholarship:</strong> {p.scholarship}</p>}
                      {p.recommended_exam_ids && <p className="text-xs text-slate-600"><strong>Recommended Exams:</strong> {p.recommended_exam_ids.split(',').map((id) => { const eid = parseInt(id.trim(), 10); return exams.find((e) => e.id === eid)?.name ?? `ID ${eid}`; }).join(', ')}</p>}
                      {(p.contact_email || p.contact_number) && <p className="text-xs text-slate-600"><strong>Contact:</strong> {[p.contact_email, p.contact_number].filter(Boolean).join(' · ')}</p>}
                      {p.brochure_url && <p className="text-xs text-slate-600"><strong>Brochure:</strong> <a href={p.brochure_url} target="_blank" rel="noopener noreferrer" className="text-[#341050] hover:underline">Download</a></p>}
                      {(p.seatMatrix?.length ?? 0) > 0 && (
                        <p className="text-xs text-slate-600">
                          <strong>Seat matrix:</strong> {(p.seatMatrix ?? []).map((s) => `${s.branch ? `${s.branch}-` : ''}${s.category ?? '-'}: ${s.seat_count ?? '-'}${s.year ? ` (${s.year})` : ''}`).join('; ')}
                        </p>
                      )}
                      {(p.previousCutoffs?.length ?? 0) > 0 && (
                        <p className="text-xs text-slate-600">
                          <strong>Previous cutoff:</strong> {(p.previousCutoffs ?? []).map((c) => `${exams.find((e) => e.id === c.exam_id)?.name ?? c.exam_id} ${(c as { branch?: string }).branch ? `${(c as { branch?: string }).branch}-` : ''}${c.category ?? ''} rank ${c.cutoff_rank ?? '-'} (${c.year ?? '-'})`).join('; ')}
                        </p>
                      )}
                      {(p.expectedCutoffs?.length ?? 0) > 0 && (
                        <p className="text-xs text-slate-600">
                          <strong>Expected cutoff:</strong> {(p.expectedCutoffs ?? []).map((c) => `${exams.find((e) => e.id === c.exam_id)?.name ?? c.exam_id} ${(c as { branch?: string }).branch ? `${(c as { branch?: string }).branch}-` : ''}${c.category ?? ''} rank ${c.expected_rank ?? '-'} (${c.year ?? '-'})`).join('; ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
              <button type="button" onClick={() => setViewingData(null)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-[#F6F8FA]">Close</button>
              <button type="button" onClick={() => { setViewingData(null); handleEdit(viewingData); }} className="px-3 py-1.5 text-sm bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90">Edit</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-highlight-100 flex items-center justify-center text-[#341050]">
                  <FiUpload className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Bulk upload colleges</h2>
                  <p className="text-xs text-slate-500">Excel + optional logos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto space-y-5">
              {canDownloadExcel && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F6F8FA] border border-slate-100">
                  <div className="h-10 w-10 rounded-lg bg-[#341050] hover:bg-[#2a0c40] flex items-center justify-center text-white shrink-0">
                    <FiDownload className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900">Get the template</p>
                    <p className="text-xs text-slate-500 mt-0.5">Download the Excel file with all columns</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleBulkTemplateDownload}
                    className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg hover:opacity-90 transition-opacity"
                  >
                    Download
                  </button>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  Excel file <span className="text-red-500">*</span>
                </p>
                <label className="block w-full">
                  <div className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer w-full min-h-[120px] ${bulkExcelFile ? 'border-[#341050]/40 bg-[#341050]/5' : 'border-slate-200 hover:border-slate-300 hover:bg-[#F6F8FA]/50'}`}>
                    <FiFile className={`h-10 w-10 ${bulkExcelFile ? 'text-[#341050]' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {bulkExcelFile ? bulkExcelFile.name : 'Choose Excel file (.xlsx, .xls)'}
                    </span>
                    {bulkExcelFile ? (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBulkExcelFile(null); }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkExcelFile(e.target.files?.[0] ?? null)}
                    className="sr-only"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-900">
                  Logos ZIP <span className="text-xs font-normal text-slate-500">(optional)</span>
                </p>
                <label className="block w-full">
                  <div className={`relative flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed transition-colors cursor-pointer w-full min-h-[120px] ${bulkLogosZipFile ? 'border-[#341050]/40 bg-[#341050]/5' : 'border-slate-200 hover:border-slate-300 hover:bg-[#F6F8FA]/50'}`}>
                    <FiImage className={`h-10 w-10 ${bulkLogosZipFile ? 'text-[#341050]' : 'text-slate-400'}`} />
                    <span className="text-sm font-medium text-slate-700">
                      {bulkLogosZipFile ? bulkLogosZipFile.name : 'Choose ZIP file'}
                    </span>
                    {bulkLogosZipFile ? (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setBulkLogosZipFile(null); setBulkLogoFiles([]); }}
                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file?.name.toLowerCase().endsWith('.zip')) {
                        setBulkLogosZipFile(file);
                        setBulkLogoFiles([]);
                      }
                      e.target.value = '';
                    }}
                    className="sr-only"
                  />
                </label>
              </div>

              {bulkError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  <FiX className="h-4 w-4 shrink-0 mt-0.5" />
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="p-3 rounded-xl bg-[#F6F8FA] border border-slate-200 text-sm space-y-1">
                  <p className="font-medium text-slate-900">Created: {bulkResult.created}</p>
                  {bulkResult.errors > 0 && (
                    <p className="text-amber-700">Errors: {bulkResult.errors} row(s)</p>
                  )}
                  {bulkResult.errorDetails?.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 list-disc list-inside max-h-32 overflow-y-auto">
                      {bulkResult.errorDetails.map((e, i) => (
                        <li key={i}>Row {e.row}: {e.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              <p className="text-xs text-slate-500 pt-1">
                File names inside the ZIP must match <strong>logo_filename</strong> in Excel.
              </p>
            </div>
            <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-3 bg-[#F6F8FA]/50">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {bulkUploading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FiUpload className="h-4 w-4" />
                    Upload
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Missing Logos Modal */}
      {showMissingLogosModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col ring-1 ring-black/5">
            <div className="border-b border-slate-200 bg-slate-50 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-highlight-100 text-[#341050]">
                  <FiUpload className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-semibold tracking-tight text-slate-900">Upload missing logos</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowMissingLogosModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors"
                aria-label="Close"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 overflow-auto space-y-5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Upload a ZIP containing logo images. File names must match the <code className="px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-800 font-mono text-xs">logo_filename</code> stored for colleges that have no logo yet.
                </p>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-2">ZIP file (required)</label>
                <label className="flex flex-col items-center justify-center w-full min-h-[120px] rounded-xl border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 transition-all cursor-pointer group">
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    className="hidden"
                    onChange={(e) => {
                      setMissingLogosZipFile(e.target.files?.[0] ?? null);
                      setMissingLogosResult(null);
                      setMissingLogosError(null);
                      e.target.value = '';
                    }}
                  />
                  {missingLogosZipFile ? (
                    <div className="flex flex-col items-center gap-2 p-4">
                      <div className="p-2 rounded-full bg-green-100 text-green-600">
                        <FiUpload className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium text-slate-800 truncate max-w-[240px]">{missingLogosZipFile.name}</span>
                      <button
                        type="button"
                        onClick={(ev) => { ev.preventDefault(); ev.stopPropagation(); setMissingLogosZipFile(null); setMissingLogosResult(null); setMissingLogosError(null); }}
                        className="text-xs text-slate-500 hover:text-red-600 transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 text-slate-500 group-hover:text-slate-600">
                      <FiUpload className="h-8 w-8 opacity-60" />
                      <span className="text-sm font-medium">Drop ZIP here or click to browse</span>
                      <span className="text-xs">.zip only</span>
                    </div>
                  )}
                </label>
              </div>
              {missingLogosError && (
                <div className="bg-red-50 border border-red-200/80 text-red-700 px-4 py-3 text-sm rounded-xl">
                  {missingLogosError}
                </div>
              )}
              {missingLogosResult && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                  <p className="font-semibold text-slate-900">
                    ✓ Logos added: {missingLogosResult.summary.logosAdded}
                  </p>
                  {missingLogosResult.summary.filesSkipped > 0 && (
                    <p className="text-sm text-amber-700">Files skipped (no matching college): {missingLogosResult.summary.filesSkipped}</p>
                  )}
                  {missingLogosResult.summary.uploadErrors > 0 && (
                    <p className="text-sm text-red-700">Upload errors: {missingLogosResult.summary.uploadErrors}</p>
                  )}
                  {missingLogosResult.updated.length > 0 && (
                    <ul className="text-xs text-slate-600 list-disc list-inside max-h-24 overflow-y-auto space-y-0.5">
                      {missingLogosResult.updated.map((u, i) => (
                        <li key={i}>{u.college_name}</li>
                      ))}
                    </ul>
                  )}
                  {missingLogosResult.skipped.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Skipped files:</p>
                      <ul className="text-xs text-slate-500 list-disc list-inside max-h-16 overflow-y-auto space-y-0.5">
                        {missingLogosResult.skipped.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-5 py-4 border-t border-slate-200/80 bg-slate-50/50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowMissingLogosModal(false)}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleMissingLogosSubmit}
                disabled={!missingLogosZipFile || missingLogosUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {missingLogosUploading ? (
                  <>
                    <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <FiUpload className="h-4 w-4" />
                    Upload
                  </>
                )}
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
      />
    </div>
  );
}
