'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllSubjects, createSubject, updateSubject, deleteSubject, downloadSubjectsBulkTemplate, downloadAllSubjectsExcel, bulkUploadSubjects, Subject } from '@/api';
import { getAllStreamsPublic } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiUpload, FiDownload } from 'react-icons/fi';
import { ConfirmationModal, useToast, MultiSelect, SelectOption } from '@/components/shared';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function SubjectsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', streams: [] as number[], status: true });
  const [availableStreams, setAvailableStreams] = useState<SelectOption[]>([]);
  const [selectedStreams, setSelectedStreams] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingSubject, setViewingSubject] = useState<Subject | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; createdSubjects: { id: number; name: string }[]; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const { canEdit, canDownloadExcel } = useAdminPermissions();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchSubjects();
    fetchStreams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await getAllStreamsPublic();
      if (response.success && response.data) {
        setAvailableStreams(
          response.data.streams.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching streams:', err);
    }
  };

  useEffect(() => {
    if (allSubjects.length === 0) {
      setSubjects([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSubjects(allSubjects);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allSubjects.filter(subject =>
        subject.name.toLowerCase().includes(searchLower)
      );
      setSubjects(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allSubjects]);

  const fetchSubjects = async () => {
    try {
      setIsLoading(true);
      const response = await getAllSubjects();
      if (response.success && response.data) {
        setAllSubjects(response.data.subjects);
        setSubjects(response.data.subjects);
      } else {
        setError(response.message || 'Failed to fetch subjects');
      }
    } catch (err) {
      setError('An error occurred while fetching subjects');
      console.error('Error fetching subjects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name) {
      setError('Name is required');
      return;
    }

    try {
      const submitData = {
        ...formData,
        streams: selectedStreams.map((s) => Number(s)),
      };

      if (editingSubject) {
        const response = await updateSubject(editingSubject.id, submitData);
        if (response.success) {
          showSuccess('Subject updated successfully');
          setShowModal(false);
          resetForm();
          fetchSubjects();
        } else {
          const errorMsg = response.message || 'Failed to update subject';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const response = await createSubject(submitData);
        if (response.success) {
          showSuccess('Subject created successfully');
          setShowModal(false);
          resetForm();
          fetchSubjects();
        } else {
          const errorMsg = response.message || 'Failed to create subject';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving subject';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving subject:', err);
    }
  };

  const handleView = (subject: Subject) => {
    setViewingSubject(subject);
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
      const response = await deleteSubject(deletingId);
      if (response.success) {
        showSuccess('Subject deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchSubjects();
      } else {
        const errorMsg = response.message || 'Failed to delete subject';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting subject';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting subject:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    const streams = Array.isArray(subject.streams) ? subject.streams : [];
    setFormData({ name: subject.name, streams, status: subject.status });
    setSelectedStreams(streams.map((id) => String(id)));
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingSubject(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', streams: [], status: true });
    setSelectedStreams([]);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubject(null);
    resetForm();
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await downloadSubjectsBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleDownloadExcel = async () => {
    try {
      setDownloadingExcel(true);
      await downloadAllSubjectsExcel();
      showSuccess('Excel downloaded');
    } catch {
      showError('Failed to download Excel');
    } finally {
      setDownloadingExcel(false);
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
      const response = await bulkUploadSubjects(bulkExcelFile);
      if (response.success && response.data) {
        setBulkResult({
          created: response.data.created,
          createdSubjects: response.data.createdSubjects || [],
          errors: response.data.errors || 0,
          errorDetails: response.data.errorDetails || [],
        });
        showSuccess(response.message || `Created ${response.data.created} subject(s)`);
        fetchSubjects();
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Subjects Manager</h1>
            <p className="text-sm text-gray-600">Manage subject options that users can select.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All subjects</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allSubjects.length}
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
              {canDownloadExcel && (
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
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Subject
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Subjects Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading subjects...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        NAME
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        STREAMS
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
                    {subjects.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {subjects.length < allSubjects.length ? 'No subjects found matching your search' : 'No subjects found'}
                        </td>
                      </tr>
                    ) : (
                      subjects.map((subject) => {
                        const streams = Array.isArray(subject.streams) ? subject.streams : [];
                        return (
                          <tr key={subject.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900">{subject.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              {streams.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {streams.slice(0, 2).map((streamId) => {
                                    const stream = availableStreams.find((s) => s.value === String(streamId));
                                    return (
                                      <span
                                        key={streamId}
                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                                      >
                                        {stream?.label || `Stream ${streamId}`}
                                      </span>
                                    );
                                  })}
                                  {streams.length > 2 && (
                                    <span className="text-xs text-gray-500">+{streams.length - 2}</span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {subject.status ? (
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
                            {new Date(subject.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(subject.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(subject)}
                              onEdit={() => handleEdit(subject)}
                              onDelete={() => handleDeleteClick(subject.id)}
                            />
                          </td>
                        </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingSubject ? 'Edit Subject' : 'Create Subject'}
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
                    placeholder="e.g., Mathematics, Physics, Chemistry"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Streams
                  </label>
                  <MultiSelect
                    options={availableStreams}
                    value={selectedStreams}
                    onChange={setSelectedStreams}
                    placeholder="Select streams"
                    isSearchable
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
                {editingSubject ? 'Update' : 'Create'}
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
              <h2 className="text-lg font-bold">Bulk Upload Subjects</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="text-white hover:text-gray-200">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Sample template – Excel format</h3>
                <p className="text-xs text-gray-600 mb-3">Your Excel file must have these columns. streams: comma/semicolon-separated names or IDs (e.g. PCM, PCB, PCMB).</p>
                <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200">name</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-r border-gray-200">streams</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-200">status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Physics</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">PCM, PCB, PCMB</td>
                        <td className="px-3 py-2 text-gray-800">TRUE</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Chemistry</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">PCM, PCB, PCMB</td>
                        <td className="px-3 py-2 text-gray-800">TRUE</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">Mathematics</td>
                        <td className="px-3 py-2 text-gray-800 border-r border-gray-200">PCM, PCMB</td>
                        <td className="px-3 py-2 text-gray-800">TRUE</td>
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
                  {bulkResult.errors > 0 && <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>}
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
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      {/* View Subject Modal */}
      {showViewModal && viewingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">View Subject</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingSubject(null);
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
                <p className="text-lg font-bold text-gray-900">{viewingSubject.name}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingSubject.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingSubject.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Streams */}
              {viewingSubject.streams && viewingSubject.streams.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Streams</label>
                  <div className="flex flex-wrap gap-1">
                    {viewingSubject.streams.map((streamId) => {
                      const stream = availableStreams.find((s) => Number(s.value) === streamId);
                      return (
                        <span
                          key={streamId}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                        >
                          {stream?.label || `Stream ${streamId}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Created At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingSubject.created_at).toLocaleString('en-US', {
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
                  {new Date(viewingSubject.updated_at).toLocaleString('en-US', {
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
                  setViewingSubject(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {canEdit && (
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingSubject);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


