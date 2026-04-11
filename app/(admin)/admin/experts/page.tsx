'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllExpertsAdmin,
  createExpert,
  updateExpert,
  deleteExpert,
  downloadExpertsBulkTemplate,
  downloadAllExpertsExcel,
  bulkUploadExperts,
  uploadExpertPhotos,
} from '@/api/admin/experts';
import type { AdmissionExpert } from '@/api/experts';
import { FiPlus, FiX, FiUpload, FiUser, FiDownload, FiImage } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast } from '@/components/shared';
import Image from 'next/image';

const TYPE_OPTIONS = [
  { value: 'career_consultant', label: 'Career Consultant' },
  { value: 'essay_resume', label: 'Essay & Resume' },
  { value: 'travel_visa', label: 'Travel & Visa' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'loans_finance', label: 'Loans & Finance' },
];

export default function ExpertsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [experts, setExperts] = useState<AdmissionExpert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AdmissionExpert | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState('career_consultant');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formActive, setFormActive] = useState(true);
  const [formPhoto, setFormPhoto] = useState<File | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdExperts: { id: number; name: string }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
    photosAdded?: number;
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkPhotosZip, setBulkPhotosZip] = useState<File | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);

  const [showExpertPhotosModal, setShowExpertPhotosModal] = useState(false);
  const [expertPhotosZipFile, setExpertPhotosZipFile] = useState<File | null>(null);
  const [expertPhotosUploading, setExpertPhotosUploading] = useState(false);
  const [expertPhotosResult, setExpertPhotosResult] = useState<{
    summary: { photosAdded: number; filesSkipped: number; uploadErrors: number };
    updated: { id: number; name: string; photo_file_name: string }[];
    skipped: string[];
    errors: { file: string; message: string }[];
  } | null>(null);
  const [expertPhotosError, setExpertPhotosError] = useState<string | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchExperts();
  }, [router]);

  const fetchExperts = async () => {
    setIsLoading(true);
    try {
      const res = await getAllExpertsAdmin();
      if (res.success && res.data) {
        setExperts(res.data.experts);
      }
    } catch (err) {
      showError('Failed to load experts');
    } finally {
      setIsLoading(false);
    }
  };

  const openModal = (expert?: AdmissionExpert) => {
    if (expert) {
      setEditing(expert);
      setFormName(expert.name);
      setFormPhone(expert.phone ?? '');
      setFormEmail(expert.email ?? '');
      setFormDescription(expert.description ?? '');
      setFormType(expert.type);
      setFormLinkedin(expert.linkedin_url ?? '');
      setFormWebsite(expert.website ?? '');
      setFormActive(expert.is_active !== false);
    } else {
      setEditing(null);
      setFormName('');
      setFormPhone('');
      setFormEmail('');
      setFormDescription('');
      setFormType('career_consultant');
      setFormLinkedin('');
      setFormWebsite('');
      setFormActive(true);
    }
    setFormPhoto(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      showError('Name is required');
      return;
    }

    setFormSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', formName);
      formData.append('phone', formPhone);
      formData.append('email', formEmail);
      formData.append('description', formDescription);
      formData.append('type', formType);
      formData.append('linkedin_url', formLinkedin.trim());
      formData.append('website', formWebsite.trim());
      if (editing) {
        formData.append('is_active', formActive ? 'true' : 'false');
      }
      if (formPhoto) formData.append('photo', formPhoto);

      let res;
      if (editing) {
        res = await updateExpert(editing.id, formData);
      } else {
        res = await createExpert(formData);
      }

      if (res.success) {
        showSuccess(editing ? 'Expert updated' : 'Expert created');
        setShowModal(false);
        fetchExperts();
      } else {
        showError(res.message || 'Failed to save expert');
      }
    } catch (err) {
      showError('Something went wrong');
    } finally {
      setFormSaving(false);
    }
  };

  const handleDelete = async () => {
    if (deletingId === null) return;
    setIsDeleting(true);
    try {
      const res = await deleteExpert(deletingId);
      if (res.success) {
        showSuccess('Expert deleted');
        fetchExperts();
      } else {
        showError(res.message || 'Failed to delete');
      }
    } catch (err) {
      showError('Failed to delete expert');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const typeLabel = (type: string) => TYPE_OPTIONS.find(t => t.value === type)?.label || type;

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true);
    try {
      await downloadExpertsBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadExcel = async () => {
    setDownloadingExcel(true);
    try {
      await downloadAllExpertsExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkExcelFile) return;
    setBulkUploading(true);
    setBulkError(null);
    setBulkResult(null);
    try {
      const res = await bulkUploadExperts(bulkExcelFile, bulkPhotosZip || undefined);
      if (res.success && res.data) {
        setBulkResult(res.data);
        showSuccess(res.message || `Created ${res.data.created} expert(s)`);
        fetchExperts();
        if (res.data.errors === 0) setShowBulkModal(false);
        else setBulkExcelFile(null);
      } else {
        setBulkError(res.message || 'Bulk upload failed');
      }
    } catch {
      setBulkError('Bulk upload failed');
      showError('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleUploadExpertPhotos = async () => {
    if (!expertPhotosZipFile) return;
    setExpertPhotosUploading(true);
    setExpertPhotosError(null);
    setExpertPhotosResult(null);
    try {
      const res = await uploadExpertPhotos(expertPhotosZipFile);
      if (res.success && res.data) {
        setExpertPhotosResult(res.data);
        showSuccess(res.message || 'Expert photos attached');
        fetchExperts();
      } else {
        setExpertPhotosError(res.message || 'Upload failed');
      }
    } catch {
      setExpertPhotosError('Upload failed');
      showError('Upload failed');
    } finally {
      setExpertPhotosUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Admission Experts</h1>
            <p className="text-sm text-slate-600">Manage experts shown on the Admission Help page.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors">
                <span className="text-xs font-medium text-slate-700">All experts</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  {experts.length}
                </span>
              </button>
            </div>
            <div className="inline-flex items-center gap-2">
              <button
                onClick={() => openModal()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Expert
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(true);
                  setBulkResult(null);
                  setBulkError(null);
                  setBulkExcelFile(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors"
              >
                <FiUpload className="h-4 w-4" />
                Bulk upload (Excel)
              </button>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={downloadingExcel}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors disabled:opacity-50"
              >
                <FiDownload className="h-4 w-4" />
                {downloadingExcel ? 'Downloading...' : 'Download Excel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowExpertPhotosModal(true);
                  setExpertPhotosZipFile(null);
                  setExpertPhotosResult(null);
                  setExpertPhotosError(null);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] transition-colors"
              >
                <FiImage className="h-4 w-4" />
                Upload expert photos
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading experts...</div>
            ) : experts.length === 0 ? (
              <div className="p-8 text-center">
                <FiUser className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No experts added yet. Click &quot;Add Expert&quot; to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PHOTO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">PHONE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">EMAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TYPE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {experts.map((expert) => (
                      <tr key={expert.id} className="hover:bg-[#F6F8FA] transition-colors">
                        <td className="px-4 py-2">
                          <div className="h-10 w-10 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                            {expert.photo_url ? (
                              <Image
                                src={expert.photo_url}
                                alt={expert.name}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
                                unoptimized
                              />
                            ) : (
                              <FiUser className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 font-medium text-slate-900 text-sm">{expert.name}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{expert.phone || '—'}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{expert.email || '—'}</td>
                        <td className="px-4 py-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#341050]/10 text-[#341050]-700">
                            {typeLabel(expert.type)}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            expert.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {expert.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-2">
                          <AdminTableActions
                            onEdit={() => openModal(expert)}
                            onDelete={() => {
                              setDeletingId(expert.id);
                              setShowDeleteConfirm(true);
                            }}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing ? 'Edit Expert' : 'Add Expert'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-800 transition-colors">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Name <span className="text-[#341050]">*</span></label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Expert name"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short bio or description"
                  rows={3}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">LinkedIn profile</label>
                <input
                  type="url"
                  value={formLinkedin}
                  onChange={(e) => setFormLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/..."
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formWebsite}
                  onChange={(e) => setFormWebsite(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Type <span className="text-[#341050]">*</span></label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                >
                  {TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {editing && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActive}
                    onChange={(e) => setFormActive(e.target.checked)}
                    className="rounded border-slate-300 text-[#341050] focus:ring-[#341050]/25"
                  />
                  <span className="text-sm text-slate-700">Expert visible on Admission Help</span>
                </label>
              )}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Photo</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiUpload className="w-5 h-5 text-slate-400" />
                  <span className="text-sm text-slate-500">
                    {formPhoto ? formPhoto.name : 'Upload photo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormPhoto(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-3 py-1.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={formSaving}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {formSaving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk upload experts</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkExcelFile(null);
                  setBulkPhotosZip(null);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <p className="text-xs text-slate-600">
                Columns: name, phone, email, description, type, photo_file_name, linkedin_url, website (last two optional). Photos are stored in S3. Optionally attach a ZIP of images—names must match photo_file_name—or upload later via &quot;Upload expert photos&quot; or Edit.
              </p>
              <div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingTemplate ? 'Downloading...' : 'Download template'}
                </button>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Excel file</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiUpload className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {bulkExcelFile ? bulkExcelFile.name : 'Choose .xlsx or .xls file'}
                  </span>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">Photos (ZIP) <span className="text-slate-500 font-normal">optional</span></label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiImage className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {bulkPhotosZip ? bulkPhotosZip.name : 'Choose .zip (images named to match photo_file_name)'}
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => setBulkPhotosZip(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>
              {bulkError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
                  {bulkError}
                </div>
              )}
              {bulkResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Created: {bulkResult.created}</p>
                  {bulkResult.photosAdded != null && bulkResult.photosAdded > 0 && (
                    <p className="text-green-700 mt-1">Photos attached: {bulkResult.photosAdded}</p>
                  )}
                  {bulkResult.errors > 0 && (
                    <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>
                  )}
                  {bulkResult.errorDetails && bulkResult.errorDetails.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 max-h-32 overflow-auto">
                      {bulkResult.errorDetails.map((err, i) => (
                        <li key={i}>
                          Row {err.row}: {err.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkExcelFile(null);
                  setBulkPhotosZip(null);
                  setBulkResult(null);
                  setBulkError(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkUpload}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload expert photos modal */}
      {showExpertPhotosModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Upload expert photos</h2>
              <button
                onClick={() => {
                  setShowExpertPhotosModal(false);
                  setExpertPhotosZipFile(null);
                  setExpertPhotosResult(null);
                  setExpertPhotosError(null);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <p className="text-xs text-slate-600">
                Upload a ZIP containing expert photos (e.g. .jpg, .png). File names must match the <strong>photo_file_name</strong> stored for each expert. Use the bulk Excel template with photo_file_name column, then upload the ZIP here or together with the Excel.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">ZIP file</label>
                <label className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-slate-300 hover:border-[#341050]/40 hover:bg-[#341050]/5 cursor-pointer transition-colors">
                  <FiImage className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="text-sm text-slate-600">
                    {expertPhotosZipFile ? expertPhotosZipFile.name : 'Choose .zip file'}
                  </span>
                  <input
                    type="file"
                    accept=".zip,application/zip,application/x-zip-compressed"
                    onChange={(e) => {
                      setExpertPhotosZipFile(e.target.files?.[0] || null);
                      setExpertPhotosResult(null);
                      setExpertPhotosError(null);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {expertPhotosError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
                  {expertPhotosError}
                </div>
              )}
              {expertPhotosResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Photos attached: {expertPhotosResult.summary.photosAdded}</p>
                  {expertPhotosResult.summary.filesSkipped > 0 && (
                    <p className="text-amber-700 mt-1">Files skipped (no matching photo_file_name): {expertPhotosResult.summary.filesSkipped}</p>
                  )}
                  {expertPhotosResult.summary.uploadErrors > 0 && (
                    <p className="text-red-700 mt-1">Errors: {expertPhotosResult.summary.uploadErrors}</p>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExpertPhotosModal(false);
                  setExpertPhotosZipFile(null);
                  setExpertPhotosResult(null);
                  setExpertPhotosError(null);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleUploadExpertPhotos}
                disabled={!expertPhotosZipFile || expertPhotosUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {expertPhotosUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDelete}
        title="Delete Expert"
        message="Are you sure you want to delete this expert? This action cannot be undone."
        confirmText={isDeleting ? 'Deleting...' : 'Delete'}
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
