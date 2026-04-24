'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllSubtopics,
  createSubtopic,
  updateSubtopic,
  deleteSubtopic,
  downloadSubtopicsBulkTemplate,
  bulkUploadSubtopics,
  Subtopic,
} from '@/api';
import { getAllTopics } from '@/api';
import { FiPlus, FiSearch, FiX, FiUpload, FiDownload } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, SelectOption } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function SubtopicsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { canEdit } = useAdminPermissions();
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [allSubtopics, setAllSubtopics] = useState<Subtopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<Subtopic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    topic_id: '',
    name: '',
  });
  const [availableTopics, setAvailableTopics] = useState<SelectOption[]>([]);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{
    created: number;
    createdItems: { id: number; name: string; topic_id: number }[];
    errors: number;
    errorDetails: { row: number; message: string }[];
  } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingSubtopic, setViewingSubtopic] = useState<Subtopic | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchSubtopics();
    fetchTopics();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await getAllTopics();
      if (response.success && response.data) {
        setAvailableTopics(
          response.data.topics.map((t) => ({
            value: String(t.id),
            label: t.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching topics:', err);
    }
  };

  useEffect(() => {
    if (allSubtopics.length === 0) {
      setSubtopics([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setSubtopics(allSubtopics);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allSubtopics.filter(subtopic =>
        subtopic.name.toLowerCase().includes(searchLower)
      );
      setSubtopics(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allSubtopics]);

  const fetchSubtopics = async () => {
    try {
      setIsLoading(true);
      const response = await getAllSubtopics();
      if (response.success && response.data) {
        setAllSubtopics(response.data.subtopics);
        setSubtopics(response.data.subtopics);
      } else {
        setError(response.message || 'Failed to fetch subtopics');
      }
    } catch (err) {
      setError('An error occurred while fetching subtopics');
      console.error('Error fetching subtopics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!formData.topic_id || !formData.name.trim()) {
      setError('Topic and name are required');
      return;
    }
    setIsSubmitting(true);

    try {
      let response;
      if (editingSubtopic) {
        response = await updateSubtopic(editingSubtopic.id, {
          topic_id: parseInt(formData.topic_id, 10),
          name: formData.name.trim(),
        });
      } else {
        response = await createSubtopic({
          topic_id: parseInt(formData.topic_id, 10),
          name: formData.name.trim(),
          status: true,
          sort_order: 0,
        });
      }

      if (response.success) {
        showSuccess(editingSubtopic ? 'Subtopic updated successfully' : 'Subtopic created successfully');
        fetchSubtopics();
        handleModalClose();
      } else {
        setError(response.message || 'Failed to save subtopic');
        showError(response.message || 'Failed to save subtopic');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while saving subtopic';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = () => {
    setEditingSubtopic(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (subtopic: Subtopic) => {
    setEditingSubtopic(subtopic);
    setFormData({
      topic_id: String(subtopic.topic_id),
      name: subtopic.name,
    });
    setShowModal(true);
  };

  const handleView = (subtopic: Subtopic) => {
    setViewingSubtopic(subtopic);
    setShowViewModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteSubtopic(deletingId);
      if (response.success) {
        showSuccess('Subtopic deleted successfully');
        fetchSubtopics();
      } else {
        showError(response.message || 'Failed to delete subtopic');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to delete subtopic');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const resetForm = () => {
    setFormData({
      topic_id: '',
      name: '',
    });
    setError(null);
  };

  const handleDownloadSubtopicsTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      await downloadSubtopicsBulkTemplate();
      showSuccess('Template downloaded');
    } catch {
      showError('Failed to download template');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleBulkUploadSubtopics = async () => {
    if (!bulkExcelFile) {
      setBulkError('Please select an Excel file');
      return;
    }
    try {
      setBulkUploading(true);
      setBulkError(null);
      setBulkResult(null);
      const response = await bulkUploadSubtopics(bulkExcelFile);
      if (response.success && response.data) {
        setBulkResult({
          created: response.data.created,
          createdItems: response.data.createdItems || [],
          errors: response.data.errors || 0,
          errorDetails: response.data.errorDetails || [],
        });
        showSuccess(response.message || `Created ${response.data.created} subtopic(s)`);
        fetchSubtopics();
        if (response.data.errors === 0) {
          setBulkExcelFile(null);
          setShowBulkModal(false);
        }
      } else {
        setBulkError(response.message || 'Bulk upload failed');
      }
    } catch {
      setBulkError('An error occurred during bulk upload');
      showError('Bulk upload failed');
    } finally {
      setBulkUploading(false);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubtopic(null);
    resetForm();
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-[#341050] hover:underline"
          >
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
            <h1 className="text-xl font-bold text-slate-900 mb-1">Subtopics Manager</h1>
            <p className="text-sm text-slate-600">Manage subtopics that belong to topics.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors">
                <span className="text-xs font-medium text-slate-700">All subtopics</span>
                <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                  {allSubtopics.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadSubtopicsTemplate}
                    disabled={downloadingTemplate}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50"
                  >
                    <FiDownload className="h-4 w-4" />
                    {downloadingTemplate ? 'Downloading…' : 'Template'}
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
                    Upload Excel
                  </button>
                </>
              )}
              <button
                onClick={handleCreate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                <FiPlus className="h-4 w-4" />
                Add Subtopic
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Subtopics Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading subtopics...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">TOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {subtopics.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                          {subtopics.length < allSubtopics.length ? 'No subtopics found matching your search' : 'No subtopics found'}
                        </td>
                      </tr>
                    ) : (
                      subtopics.map((subtopic) => {
                        const topic = availableTopics.find((t) => t.value === String(subtopic.topic_id));
                        return (
                          <tr key={subtopic.id} className="hover:bg-[#F6F8FA] transition-colors">
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-slate-900">{subtopic.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-slate-600">{topic?.label || `Topic ${subtopic.topic_id}`}</span>
                            </td>
                            <td className="px-4 py-2">
                              {subtopic.status ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                  Inactive
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-600">
                              {new Date(subtopic.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <AdminTableActions
                                onView={() => handleView(subtopic)}
                                onEdit={() => handleEdit(subtopic)}
                                onDelete={() => handleDeleteClick(subtopic.id)}
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

      {/* Subtopic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingSubtopic ? 'Edit Subtopic' : 'Create Subtopic'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Topic <span className="text-[#341050]">*</span>
                  </label>
                  <Select
                    options={availableTopics}
                    value={formData.topic_id}
                    onChange={(value) => setFormData({ ...formData, topic_id: value || '' })}
                    placeholder="Select topic"
                    isSearchable
                    isClearable={false}
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Name <span className="text-[#341050]">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Linear Equations, Quadratic Equations"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <p className="text-xs text-slate-500">
                  Subtopic names must be unique everywhere. Excel: <span className="font-mono">subtopic_name</span>,{' '}
                  <span className="font-mono">topic_name</span> (must match exactly one topic by name).
                </p>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#341050] hover:bg-[#2a0c40] rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingSubtopic ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingSubtopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Subtopic Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Name</label>
                  <p className="text-sm text-slate-900">{viewingSubtopic.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Topic</label>
                  <p className="text-sm text-slate-900">
                    {availableTopics.find((t) => t.value === String(viewingSubtopic.topic_id))?.label || `Topic ${viewingSubtopic.topic_id}`}
                  </p>
                </div>
                {viewingSubtopic.description && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <p className="text-sm text-slate-900">{viewingSubtopic.description}</p>
                  </div>
                )}
                {(viewingSubtopic.exam_ids?.length ?? 0) > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Linked exam IDs (legacy)</label>
                    <p className="text-sm text-slate-900">{viewingSubtopic.exam_ids!.join(', ')}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Status</label>
                    <p className="text-sm text-slate-900">{viewingSubtopic.status ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Sort Order</label>
                    <p className="text-sm text-slate-900">{viewingSubtopic.sort_order}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Created</label>
                    <p className="text-sm text-slate-900">
                      {new Date(viewingSubtopic.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk upload subtopics</h2>
              <button type="button" onClick={() => setShowBulkModal(false)} className="text-slate-500 hover:text-slate-800">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto space-y-3 text-sm text-slate-700">
              <p>
                Template columns: <span className="font-mono">subtopic_name</span>, <span className="font-mono">topic_name</span>.
                Topic name must match one topic in the database. Each <span className="font-mono">subtopic_name</span> must be
                unique in the file and in the system.
              </p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
                className="block w-full text-xs"
              />
              {bulkError && <div className="text-red-600 text-xs">{bulkError}</div>}
              {bulkResult && (
                <div className="text-xs space-y-1 border border-slate-200 rounded p-2 bg-slate-50">
                  <div>
                    Created: <strong>{bulkResult.created}</strong>, errors: <strong>{bulkResult.errors}</strong>
                  </div>
                  {bulkResult.errorDetails.length > 0 && (
                    <ul className="list-disc pl-4 max-h-32 overflow-auto">
                      {bulkResult.errorDetails.slice(0, 30).map((e, i) => (
                        <li key={i}>
                          Row {e.row}: {e.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button type="button" onClick={() => setShowBulkModal(false)} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg">
                Close
              </button>
              <button
                type="button"
                onClick={handleBulkUploadSubtopics}
                disabled={!bulkExcelFile || bulkUploading}
                className="px-3 py-1.5 text-sm bg-[#341050] text-white rounded-lg disabled:opacity-50"
              >
                {bulkUploading ? 'Uploading…' : 'Upload'}
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
        onConfirm={handleDelete}
        title="Delete Subtopic"
        message="Are you sure you want to delete this subtopic? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}

