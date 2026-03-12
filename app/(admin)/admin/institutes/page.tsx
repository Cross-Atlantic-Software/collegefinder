'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllInstitutesAdmin,
  getInstituteById,
  createInstitute,
  updateInstitute,
  deleteInstitute,
  uploadInstituteLogo,
  downloadInstitutesBulkTemplate,
  downloadAllDataExcel,
  bulkUploadInstitutes,
  deleteAllInstitutes,
  type Institute,
  type InstituteDetails,
  type InstituteStatistics,
  type InstituteCourse,
} from '@/api/admin/institutes';
import { getAllExamsAdmin, type Exam } from '@/api/admin/exams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiUpload, FiDownload, FiEye, FiFileText, FiBarChart, FiBook } from 'react-icons/fi';
import { MdSchool } from 'react-icons/md';
import { ConfirmationModal, useToast, MultiSelect } from '@/components/shared';
import Image from 'next/image';

type FormTab = 'basic' | 'details' | 'exams' | 'statistics' | 'courses';

const emptyCourse: Partial<InstituteCourse> = {
  course_name: '',
  target_class: '',
  duration_months: undefined,
  fees: undefined,
  batch_size: undefined,
  start_date: '',
};

export default function InstitutesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [institutes, setInstitutes] = useState<Institute[]>([]);
  const [allInstitutes, setAllInstitutes] = useState<Institute[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingInstitute, setEditingInstitute] = useState<Institute | null>(null);
  const [viewingData, setViewingData] = useState<{
    institute: Institute;
    instituteDetails: InstituteDetails | null;
    examIds: number[];
    examNames?: string[];
    specializationExamIds: number[];
    specializationExamNames?: string[];
    instituteStatistics: InstituteStatistics | null;
    instituteCourses: InstituteCourse[];
  } | null>(null);
  const [loadingView, setLoadingView] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>('basic');
  const [formData, setFormData] = useState({
    institute_name: '',
    institute_location: '',
    type: '' as 'offline' | 'online' | 'hybrid' | '',
    logo: '',
    website: '',
    contact_number: '',
    institute_description: '',
    demo_available: false,
    scholarship_available: false,
    examIds: [] as number[],
    specializationExamIds: [] as number[],
    ranking_score: '' as string | number,
    success_rate: '' as string | number,
    student_rating: '' as string | number,
    instituteCourses: [] as Partial<InstituteCourse>[],
  });
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
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdInstitutes: { id: number; name: string }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{ type?: string } | null>(null);
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
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      try {
        setCurrentAdmin(JSON.parse(adminUserStr));
      } catch (_) {}
    }
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allInstitutes.length === 0) {
      setInstitutes([]);
      return;
    }
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setInstitutes(allInstitutes);
        return;
      }
      const q = searchQuery.toLowerCase();
      setInstitutes(
        allInstitutes.filter(
          (c) =>
            c.institute_name.toLowerCase().includes(q) ||
            (c.institute_location && c.institute_location.toLowerCase().includes(q)) ||
            (c.type && c.type.toLowerCase().includes(q)) ||
            (c.website && c.website.toLowerCase().includes(q))
        )
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, allInstitutes]);

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      const [institutesRes, examsRes] = await Promise.all([
        getAllInstitutesAdmin(),
        getAllExamsAdmin(),
      ]);
      if (institutesRes.success && institutesRes.data) {
        setAllInstitutes(institutesRes.data.institutes);
        setInstitutes(institutesRes.data.institutes);
      }
      if (examsRes.success && examsRes.data) {
        setExams(examsRes.data.exams);
      }
    } catch (err) {
      setError('Failed to fetch institutes');
      console.error(err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadInstituteLogo(file);
      if (response.success && response.data?.logoUrl) {
        setFormData((prev) => ({ ...prev, logo: response.data!.logoUrl }));
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
        institute_name: formData.institute_name.trim(),
        institute_location: formData.institute_location.trim() || null,
        type: formData.type || null,
        logo: formData.logo || null,
        website: formData.website.trim() || null,
        contact_number: formData.contact_number.trim() || null,
        institute_description: formData.institute_description.trim() || null,
        demo_available: formData.demo_available,
        scholarship_available: formData.scholarship_available,
        examIds: formData.examIds,
        specializationExamIds: formData.specializationExamIds,
        ranking_score: formData.ranking_score === '' ? null : Number(formData.ranking_score),
        success_rate: formData.success_rate === '' ? null : Number(formData.success_rate),
        student_rating: formData.student_rating === '' ? null : Number(formData.student_rating),
        instituteCourses: formData.instituteCourses.filter(
          (c) =>
            c.course_name ||
            c.target_class ||
            c.duration_months != null ||
            c.fees != null ||
            c.batch_size != null ||
            c.start_date
        ),
      };
      if (editingInstitute) {
        const response = await updateInstitute(editingInstitute.id, payload);
        if (response.success && response.data) {
          showSuccess('Institute updated');
          setAllInstitutes((prev) =>
            prev.map((c) => (c.id === editingInstitute.id ? response.data!.institute : c))
          );
          setInstitutes((prev) =>
            prev.map((c) => (c.id === editingInstitute.id ? response.data!.institute : c))
          );
          fetchData(true);
          handleModalClose();
        } else {
          setError(response.message || 'Update failed');
          showError(response.message || 'Update failed');
        }
      } else {
        const response = await createInstitute(payload);
        if (response.success && response.data) {
          showSuccess('Institute created');
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

  const handleView = async (institute: Institute) => {
    try {
      setLoadingView(true);
      const response = await getInstituteById(institute.id);
      if (response.success && response.data) {
        setViewingData({
          institute: response.data.institute,
          instituteDetails: response.data.instituteDetails,
          examIds: response.data.examIds || [],
          specializationExamIds: response.data.specializationExamIds || [],
          instituteStatistics: response.data.instituteStatistics,
          instituteCourses: response.data.instituteCourses || [],
        });
      } else {
        showError('Failed to load institute');
      }
    } catch {
      showError('Failed to load institute');
    } finally {
      setLoadingView(false);
    }
  };

  const handleEdit = async (institute: Institute) => {
    try {
      const response = await getInstituteById(institute.id);
      if (response.success && response.data) {
        const d = response.data;
        setFormData({
          institute_name: d.institute.institute_name ?? '',
          institute_location: d.institute.institute_location ?? '',
          type: (d.institute.type as 'offline' | 'online' | 'hybrid') ?? '',
          logo: d.institute.logo ?? '',
          website: d.institute.website ?? '',
          contact_number: d.institute.contact_number ?? '',
          institute_description: d.instituteDetails?.institute_description ?? '',
          demo_available: d.instituteDetails?.demo_available ?? false,
          scholarship_available: d.instituteDetails?.scholarship_available ?? false,
          examIds: d.examIds ?? [],
          specializationExamIds: d.specializationExamIds ?? [],
          ranking_score: d.instituteStatistics?.ranking_score ?? '',
          success_rate: d.instituteStatistics?.success_rate ?? '',
          student_rating: d.instituteStatistics?.student_rating ?? '',
          instituteCourses:
            d.instituteCourses?.map((c) => ({
              id: c.id,
              course_name: c.course_name ?? '',
              target_class: c.target_class ?? '',
              duration_months: c.duration_months ?? undefined,
              fees: c.fees ?? undefined,
              batch_size: c.batch_size ?? undefined,
              start_date: c.start_date ?? '',
            })) ?? [],
        });
        setLogoPreview(d.institute.logo ?? null);
        setEditingInstitute(d.institute);
        setActiveTab('basic');
        setShowModal(true);
      }
    } catch {
      showError('Failed to load institute');
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
      const response = await deleteInstitute(deletingId);
      if (response.success) {
        showSuccess('Institute deleted');
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
    setEditingInstitute(null);
    setFormData({
      institute_name: '',
      institute_location: '',
      type: '',
      logo: '',
      website: '',
      contact_number: '',
      institute_description: '',
      demo_available: false,
      scholarship_available: false,
      examIds: [],
      specializationExamIds: [],
      ranking_score: '',
      success_rate: '',
      student_rating: '',
      instituteCourses: [],
    });
    setLogoPreview(null);
    setError(null);
    setActiveTab('basic');
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingInstitute(null);
  };

  const handleBulkTemplateDownload = async () => {
    try {
      await downloadInstitutesBulkTemplate();
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
      const response = await deleteAllInstitutes();
      if (response.success) {
        showSuccess(response.message || 'All institutes deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchData(true);
      } else {
        showError(response.message || 'Failed to delete all institutes');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all institutes');
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
      const res = await bulkUploadInstitutes(bulkExcelFile, bulkLogoFiles, bulkLogosZipFile);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} institute(s)`);
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

  const addCourseRow = () => {
    setFormData((prev) => ({
      ...prev,
      instituteCourses: [...prev.instituteCourses, { ...emptyCourse }],
    }));
  };

  const removeCourseRow = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      instituteCourses: prev.instituteCourses.filter((_, i) => i !== index),
    }));
  };

  const updateCourseRow = (index: number, field: keyof InstituteCourse, value: string | number | null | undefined) => {
    setFormData((prev) => {
      const next = [...prev.instituteCourses];
      if (!next[index]) return prev;
      next[index] = { ...next[index], [field]: value };
      return { ...prev, instituteCourses: next };
    });
  };

  const tabs: { id: FormTab; label: string; icon: typeof FiFileText }[] = [
    { id: 'basic', label: 'Basic', icon: FiFileText },
    { id: 'details', label: 'Details', icon: FiFileText },
    { id: 'exams', label: 'Exams', icon: FiBook },
    { id: 'statistics', label: 'Statistics', icon: FiBarChart },
    { id: 'courses', label: 'Courses', icon: FiBook },
  ];

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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Institutes (Coachings) Manager</h1>
            <p className="text-sm text-gray-600">
              Manage institutes with details, exams, statistics, and courses. CRUD and bulk upload (Excel + logos).
            </p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <span className="text-xs font-medium text-gray-700">All institutes</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allInstitutes.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, location, type, website"
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
                Add Institute
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
              {currentAdmin?.type === 'super_admin' && allInstitutes.length > 0 && (
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
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading institutes...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOCATION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">WEBSITE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {institutes.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {institutes.length < allInstitutes.length
                            ? 'No institutes match your search'
                            : 'No institutes yet'}
                        </td>
                      </tr>
                    ) : (
                      institutes.map((inst) => (
                        <tr key={inst.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                              {inst.logo ? (
                                <Image
                                  src={inst.logo}
                                  alt={inst.institute_name}
                                  width={48}
                                  height={48}
                                  className="object-contain"
                                  unoptimized
                                />
                              ) : (
                                <span className="text-xs text-gray-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{inst.institute_name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600">{inst.institute_location || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            {inst.type && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {inst.type}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600 truncate max-w-[120px] block">
                              {inst.website || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleView(inst)}
                                disabled={loadingView}
                                className="p-2 text-gray-600 hover:text-gray-900"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleEdit(inst)}
                                className="p-2 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(inst.id)}
                                className="p-2 text-red-600 hover:text-red-800"
                                title="Delete"
                              >
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
              <h2 className="text-lg font-bold">
                {editingInstitute ? 'Edit Institute' : 'Create Institute'}
              </h2>
              <button type="button" onClick={handleModalClose} className="text-white hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex border-b border-gray-200 px-4 gap-2 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-2 text-sm font-medium border-b-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-pink text-pink'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
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
                    <label className="block text-xs font-medium text-gray-700 mb-1">Institute Name *</label>
                    <input
                      type="text"
                      value={formData.institute_name}
                      onChange={(e) =>
                        setFormData({ ...formData, institute_name: e.target.value })
                      }
                      required
                      placeholder="e.g. Allen Kota"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={formData.institute_location}
                      onChange={(e) =>
                        setFormData({ ...formData, institute_location: e.target.value })
                      }
                      placeholder="e.g. Kota"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          type: e.target.value as 'offline' | 'online' | 'hybrid' | '',
                        })
                      }
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    >
                      <option value="">Select type</option>
                      <option value="offline">Offline</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                    {logoPreview && (
                      <div className="relative h-24 w-24 rounded-md overflow-hidden bg-gray-100 border border-gray-300 mb-2">
                        <Image
                          src={logoPreview}
                          alt="Logo"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <FiUpload className="h-4 w-4" />
                      <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Website</label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
                    <input
                      type="text"
                      value={formData.contact_number}
                      onChange={(e) =>
                        setFormData({ ...formData, contact_number: e.target.value })
                      }
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'details' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={formData.institute_description}
                      onChange={(e) =>
                        setFormData({ ...formData, institute_description: e.target.value })
                      }
                      placeholder="Brief description..."
                      rows={4}
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none"
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.demo_available}
                        onChange={(e) =>
                          setFormData({ ...formData, demo_available: e.target.checked })
                        }
                        className="rounded border-gray-300 text-pink focus:ring-pink"
                      />
                      <span className="text-sm">Demo available</span>
                    </label>
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.scholarship_available}
                        onChange={(e) =>
                          setFormData({ ...formData, scholarship_available: e.target.checked })
                        }
                        className="rounded border-gray-300 text-pink focus:ring-pink"
                      />
                      <span className="text-sm">Scholarship available</span>
                    </label>
                  </div>
                </>
              )}

              {activeTab === 'exams' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Exams offered</label>
                    <MultiSelect
                      options={exams.map((e) => ({ value: String(e.id), label: `${e.name} (${e.code})` }))}
                      value={formData.examIds.map(String)}
                      onChange={(vals) =>
                        setFormData({ ...formData, examIds: vals.map(Number) })
                      }
                      placeholder="Select exams"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Exam specializations
                    </label>
                    <MultiSelect
                      options={exams.map((e) => ({ value: String(e.id), label: `${e.name} (${e.code})` }))}
                      value={formData.specializationExamIds.map(String)}
                      onChange={(vals) =>
                        setFormData({ ...formData, specializationExamIds: vals.map(Number) })
                      }
                      placeholder="Select exams"
                    />
                  </div>
                </>
              )}

              {activeTab === 'statistics' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Ranking score</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.ranking_score}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ranking_score: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 4.5"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Success rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.success_rate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          success_rate: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 85"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Student rating</label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      max={5}
                      value={formData.student_rating}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          student_rating: e.target.value === '' ? '' : Number(e.target.value),
                        })
                      }
                      placeholder="e.g. 4.2"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                    />
                  </div>
                </>
              )}

              {activeTab === 'courses' && (
                <>
                  <div className="flex justify-between items-center">
                    <label className="block text-xs font-medium text-gray-700">Courses</label>
                    <button
                      type="button"
                      onClick={addCourseRow}
                      className="text-sm text-pink hover:underline"
                    >
                      + Add course
                    </button>
                  </div>
                  <div className="space-y-3 max-h-60 overflow-auto">
                    {formData.instituteCourses.map((course, idx) => (
                      <div
                        key={idx}
                        className="p-3 border border-gray-200 rounded-lg space-y-2 bg-gray-50"
                      >
                        <div className="flex justify-between">
                          <span className="text-xs font-medium text-gray-600">Course {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeCourseRow(idx)}
                            className="text-red-600 text-xs hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Course name"
                            value={course.course_name ?? ''}
                            onChange={(e) => updateCourseRow(idx, 'course_name', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="text"
                            placeholder="Target class"
                            value={course.target_class ?? ''}
                            onChange={(e) => updateCourseRow(idx, 'target_class', e.target.value)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            placeholder="Duration (months)"
                            value={course.duration_months ?? ''}
                            onChange={(e) =>
                              updateCourseRow(
                                idx,
                                'duration_months',
                                e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                              )
                            }
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            placeholder="Fees"
                            value={course.fees ?? ''}
                            onChange={(e) =>
                              updateCourseRow(
                                idx,
                                'fees',
                                e.target.value === '' ? undefined : parseFloat(e.target.value)
                              )
                            }
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="number"
                            placeholder="Batch size"
                            value={course.batch_size ?? ''}
                            onChange={(e) =>
                              updateCourseRow(
                                idx,
                                'batch_size',
                                e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                              )
                            }
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                          <input
                            type="date"
                            placeholder="Start date"
                            value={
                              typeof course.start_date === 'string'
                                ? course.start_date.slice(0, 10)
                                : ''
                            }
                            onChange={(e) => updateCourseRow(idx, 'start_date', e.target.value || null)}
                            className="px-2 py-1 text-sm border border-gray-300 rounded"
                          />
                        </div>
                      </div>
                    ))}
                    {formData.instituteCourses.length === 0 && (
                      <p className="text-sm text-gray-500">No courses. Click &quot;Add course&quot; to add one.</p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingInstitute ? 'Update' : 'Create'}
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
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                {viewingData.institute?.logo ? (
                  <img
                    src={viewingData.institute.logo}
                    alt={viewingData.institute?.institute_name ?? 'Logo'}
                    className="h-12 w-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-gray-200 shrink-0 flex items-center justify-center text-gray-500 text-xl">
                    <MdSchool />
                  </div>
                )}
                <h2 className="text-lg font-bold text-gray-900 truncate">{viewingData.institute?.institute_name ?? 'Institute'}</h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingData(null)}
                className="text-gray-500 hover:text-gray-700 shrink-0"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Location:</strong> {viewingData.institute?.institute_location ?? '-'}</p>
              <p><strong>Type:</strong> {viewingData.institute?.type ?? '-'}</p>
              <p><strong>Contact:</strong> {viewingData.institute?.contact_number ?? '-'}</p>
              <p><strong>Website:</strong>{' '}
                {viewingData.institute?.website ? (
                  <a href={viewingData.institute.website} target="_blank" rel="noopener noreferrer" className="text-pink hover:underline">{viewingData.institute.website}</a>
                ) : '-'}
              </p>
            </div>
            {viewingData.instituteDetails && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm text-gray-700">{viewingData.instituteDetails.institute_description ?? ''}</p>
                <p className="text-sm text-gray-600 mt-1">
                  Demo available: {viewingData.instituteDetails.demo_available ? 'Yes' : 'No'} · Scholarship available: {viewingData.instituteDetails.scholarship_available ? 'Yes' : 'No'}
                </p>
              </div>
            )}
            {viewingData.instituteStatistics && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Statistics</p>
                <p className="text-sm text-gray-600">
                  Ranking score: {viewingData.instituteStatistics.ranking_score ?? '-'} · Success rate: {viewingData.instituteStatistics.success_rate ?? '-'}% · Student rating: {viewingData.instituteStatistics.student_rating ?? '-'}
                </p>
              </div>
            )}
            {((viewingData.examNames ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700">Exams covered</p>
                <p className="text-sm text-gray-600">{(viewingData.examNames ?? []).join(', ')}</p>
              </div>
            )}
            {((viewingData.specializationExamNames ?? []).length > 0) && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700">Specialization exams</p>
                <p className="text-sm text-gray-600">{(viewingData.specializationExamNames ?? []).join(', ')}</p>
              </div>
            )}
            {((viewingData.instituteCourses ?? []).length > 0) && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Courses</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  {(viewingData.instituteCourses ?? []).map((c) => (
                    <li key={c.id} className="flex flex-wrap gap-x-2">
                      <span className="font-medium">{c.course_name || 'Unnamed'}</span>
                      <span>— Class: {c.target_class ?? '-'} · Duration: {c.duration_months ?? '-'} months · Fees: ₹{c.fees ?? '-'} · Batch size: {c.batch_size ?? '-'} · Start: {c.start_date ? String(c.start_date).slice(0, 10) : '-'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              type="button"
              onClick={() => { setViewingData(null); handleEdit(viewingData.institute); }}
              className="mt-4 px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90"
            >
              Edit
            </button>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Bulk Upload Institutes</h2>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload an Excel file (use template). Optionally attach a ZIP of logos; filenames must match the{' '}
              <code className="bg-gray-100 px-1 rounded">logo_filename</code> column.
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
            {bulkError && (
              <div className="mt-3 p-2 bg-red-50 text-red-700 text-sm rounded">{bulkError}</div>
            )}
            {bulkResult && (
              <div className="mt-3 p-2 bg-green-50 text-green-800 text-sm rounded">
                Created: {bulkResult.created}.{' '}
                {bulkResult.errors > 0 && `Errors: ${bulkResult.errors} row(s).`}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-3 py-1.5 text-sm bg-pink text-white rounded-lg hover:bg-pink/90 disabled:opacity-50"
              >
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Institute"
        message="Are you sure you want to delete this institute? All related data will be removed."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Institutes"
        message={`Are you sure you want to delete all ${allInstitutes.length} institutes? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />
    </div>
  );
}
