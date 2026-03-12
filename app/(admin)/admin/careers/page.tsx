'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCareers,
  createCareer,
  updateCareer,
  deleteCareer,
  downloadAllCareersExcel,
  downloadCareersBulkTemplate,
  bulkUploadCareers,
  deleteAllCareers,
  getAllPrograms,
  Career,
} from '@/api';
import type { Program } from '@/api/admin/programs';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiUpload, FiDownload } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect } from '@/components/shared';

export default function CareersPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [careers, setCareers] = useState<Career[]>([]);
  const [allCareers, setAllCareers] = useState<Career[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', status: true, program_ids: [] as number[] });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingCareer, setViewingCareer] = useState<Career | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; createdCareers: { id: number; name: string }[]; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ type?: string } | null>(null);

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
    fetchCareers();
    (async () => {
      try {
        const progRes = await getAllPrograms();
        if (progRes.success && progRes.data?.programs) setPrograms(progRes.data.programs);
      } catch (_) {}
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (allCareers.length === 0) {
      setCareers([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setCareers(allCareers);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allCareers.filter(career =>
        career.name.toLowerCase().includes(searchLower)
      );
      setCareers(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCareers]);

  const fetchCareers = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCareers();
      if (response.success && response.data) {
        setAllCareers(response.data.careers);
        setCareers(response.data.careers);
      } else {
        setError(response.message || 'Failed to fetch careers');
      }
    } catch (err) {
      setError('An error occurred while fetching careers');
      console.error('Error fetching careers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const programOptions = programs.map((p) => ({ value: String(p.id), label: p.name }));
  const programNameMap: Record<number, string> = Object.fromEntries(programs.map((p) => [p.id, p.name]));

  const getProgramNames = (career: Career) => {
    const ids = career.program_ids || [];
    return ids.map((id) => programNameMap[id]).filter(Boolean).join(', ') || '-';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('Name is required');
      return;
    }

    try {
      if (editingCareer) {
        const response = await updateCareer(editingCareer.id, formData);
        if (response.success) {
          showSuccess('Career updated successfully');
          setShowModal(false);
          resetForm();
          fetchCareers();
        } else {
          const errorMsg = response.message || 'Failed to update career';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const response = await createCareer(formData);
        if (response.success) {
          showSuccess('Career created successfully');
          setShowModal(false);
          resetForm();
          fetchCareers();
        } else {
          const errorMsg = response.message || 'Failed to create career';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving career';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving career:', err);
    }
  };

  const handleView = (career: Career) => {
    setViewingCareer(career);
    setShowViewModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteCareer(deletingId);
      if (response.success) {
        showSuccess('Career deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchCareers();
      } else {
        const errorMsg = response.message || 'Failed to delete career';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting career';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting career:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (career: Career) => {
    setEditingCareer(career);
    setFormData({
      name: career.name,
      status: career.status,
      program_ids: career.program_ids || [],
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCareer(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', status: true, program_ids: [] });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCareer(null);
    resetForm();
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadAllCareersExcel();
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
      const response = await deleteAllCareers();
      if (response.success) {
        showSuccess(response.message || 'All careers deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchCareers();
      } else {
        showError(response.message || 'Failed to delete all careers');
        setShowDeleteAllConfirm(false);
      }
    } catch (err) {
      showError('An error occurred while deleting all careers');
      setShowDeleteAllConfirm(false);
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await downloadCareersBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkExcelFile) {
      setBulkError('Please select an Excel file');
      return;
    }
    try {
      setBulkUploading(true);
      setBulkError(null);
      setBulkResult(null);
      const response = await bulkUploadCareers(bulkExcelFile);
      if (response.success && response.data) {
        setBulkResult({
          created: response.data.created,
          createdCareers: response.data.createdCareers || [],
          errors: response.data.errors || 0,
          errorDetails: response.data.errorDetails || [],
        });
        showSuccess(response.message || `Created ${response.data.created} career(s)`);
        fetchCareers();
        if (response.data.errors === 0) {
          setBulkExcelFile(null);
          setShowBulkModal(false);
        }
      } else {
        setBulkError(response.message || 'Bulk upload failed');
      }
    } catch (err) {
      setBulkError('An error occurred during bulk upload');
      showError('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-pink hover:underline"
          >
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Careers Manager</h1>
            <p className="text-sm text-gray-600">Manage career options that users can select.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All careers</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allCareers.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentAdmin?.type === 'super_admin' && (
                <button
                  type="button"
                  onClick={handleDownloadExcel}
                  disabled={downloadingExcel}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingExcel ? 'Downloading...' : 'Download Excel'}
                </button>
              )}
              <button
                type="button"
                onClick={() => { setShowBulkModal(true); setBulkResult(null); setBulkError(null); setBulkExcelFile(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <FiUpload className="h-4 w-4" />
                Upload Excel
              </button>
              {currentAdmin?.type === 'super_admin' && allCareers.length > 0 && (
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
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Career
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Careers Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading careers...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        NAME
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        PROGRAMS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        STATUS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        CREATED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        LAST UPDATED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {careers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {careers.length < allCareers.length ? 'No careers found matching your search' : 'No careers found'}
                        </td>
                      </tr>
                    ) : (
                      careers.map((career) => (
                        <tr key={career.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{career.name}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600 max-w-[200px] truncate" title={getProgramNames(career)}>
                            {getProgramNames(career)}
                          </td>
                          <td className="px-4 py-2">
                            {career.status ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(career.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(career.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(career)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(career)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(career.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
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

      {/* Career Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCareer ? 'Edit Career' : 'Create Career'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Engineering, Medicine, Law"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Programs
                  </label>
                  <MultiSelect
                    value={formData.program_ids.map(String)}
                    onChange={(vals) => setFormData({ ...formData, program_ids: vals.map(Number).filter((n) => !isNaN(n)) })}
                    options={programOptions}
                    placeholder="Select programs..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === true}
                        onChange={() => setFormData({ ...formData, status: true })}
                        className="w-4 h-4 text-pink focus:ring-pink"
                      />
                      <span className="text-sm text-gray-700">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="status"
                        checked={formData.status === false}
                        onChange={() => setFormData({ ...formData, status: false })}
                        className="w-4 h-4 text-pink focus:ring-pink"
                      />
                      <span className="text-sm text-gray-700">Inactive</span>
                    </label>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                    {error}
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end relative z-10">
              <button
                type="button"
                onClick={handleModalClose}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={!formData.name}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCareer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Upload Careers (Excel)</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="text-white hover:text-gray-200">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {/* Sample template section */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Sample template – Excel format</h3>
                <p className="text-xs text-gray-600 mb-3">Your Excel file must have these columns. Program names are matched to existing programs in the database.</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200">name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200">status</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">program_names</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Engineering</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">TRUE</td>
                        <td className="px-3 py-2 text-gray-800">B.Tech,M.Tech,B.E</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Medicine</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">TRUE</td>
                        <td className="px-3 py-2 text-gray-800">MBBS,MD,BDS</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Law</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">FALSE</td>
                        <td className="px-3 py-2 text-gray-800">LLB,LLM</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingTemplate ? 'Downloading...' : 'Download template'}
                </button>
              </div>

              {/* Upload section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Upload your Excel file</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-gray-300 rounded-lg p-2"
                />
              </div>
              {bulkError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{bulkError}</div>}
              {bulkResult && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Created: {bulkResult.created}</p>
                  {bulkResult.errors > 0 && (
                    <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>
                  )}
                  {bulkResult.errorDetails?.length > 0 && (
                    <ul className="mt-2 text-xs text-gray-600 max-h-32 overflow-auto">
                      {bulkResult.errorDetails.map((err, i) => (
                        <li key={i}>Row {err.row}: {err.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                Close
              </button>
              <button onClick={handleBulkUpload} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Career"
        message="Are you sure you want to delete this career? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      {/* Delete All Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Careers"
        message={`Are you sure you want to delete all ${allCareers.length} careers? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />

      {/* View Career Modal */}
      {showViewModal && viewingCareer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">View Career</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingCareer(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Name</label>
                <p className="text-lg font-bold text-gray-900">{viewingCareer.name}</p>
              </div>

              {/* Programs */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Programs</label>
                <p className="text-sm text-gray-700">{getProgramNames(viewingCareer)}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingCareer.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingCareer.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingCareer.created_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Updated At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Updated At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingCareer.updated_at).toLocaleString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingCareer(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingCareer);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
