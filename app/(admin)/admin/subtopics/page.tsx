'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllSubtopics, getSubtopicById, createSubtopic, updateSubtopic, deleteSubtopic, deleteAllSubtopics, downloadSubtopicsBulkTemplate, bulkUploadSubtopics, Subtopic } from '@/api';
import { getAllTopics } from '@/api';
import { getAllExamsAdmin } from '@/api/admin/exams';
import { FiPlus, FiSearch, FiX, FiUpload, FiDownload, FiTrash2 } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, SelectOption, MultiSelect } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function SubtopicsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
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
    status: true,
    description: '',
    sort_order: 0,
    exam_ids: [] as number[],
  });
  const [availableTopics, setAvailableTopics] = useState<SelectOption[]>([]);
  const [availableExams, setAvailableExams] = useState<SelectOption[]>([]);
  const MAX_EXAMS = 10;
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingSubtopic, setViewingSubtopic] = useState<Subtopic | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkExcelFile, setBulkExcelFile] = useState<File | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ created: number; errors: number; errorDetails: { row: number; message: string }[] } | null>(null);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { canDelete } = useAdminPermissions();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchSubtopics();
    fetchTopics();
    fetchExams();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExams = async () => {
    try {
      const res = await getAllExamsAdmin();
      if (res.success && res.data?.exams) {
        setAvailableExams(res.data.exams.map((e) => ({ value: String(e.id), label: `${e.name} (${e.code})` })));
      }
    } catch (err) {
      console.error('Error fetching exams:', err);
    }
  };

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

    const nameTrim = formData.name.trim();
    if (!formData.topic_id) {
      const msg = 'Topic is required';
      setError(msg);
      showError(msg);
      return;
    }
    if (!nameTrim) {
      const msg = 'Subtopic name is required';
      setError(msg);
      showError(msg);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = editingSubtopic
        ? {
            topic_id: parseInt(formData.topic_id, 10),
            name: nameTrim,
            status: formData.status,
            sort_order: formData.sort_order,
          }
        : {
            topic_id: parseInt(formData.topic_id, 10),
            name: nameTrim,
          };

      const response = editingSubtopic
        ? await updateSubtopic(editingSubtopic.id, payload)
        : await createSubtopic(payload);

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

  const handleEdit = async (subtopic: Subtopic) => {
    setEditingSubtopic(subtopic);
    let examIds = subtopic.exam_ids ?? [];
    if (examIds.length === 0 && subtopic.id) {
      try {
        const res = await getSubtopicById(subtopic.id);
        if (res.success && res.data?.subtopic?.exam_ids) {
          examIds = res.data.subtopic.exam_ids;
        }
      } catch (_) {}
    }
    setFormData({
      topic_id: String(subtopic.topic_id),
      name: subtopic.name,
      status: subtopic.status,
      description: subtopic.description || '',
      sort_order: subtopic.sort_order,
      exam_ids: examIds,
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
      status: true,
      description: '',
      sort_order: 0,
      exam_ids: [],
    });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubtopic(null);
    resetForm();
  };

  const handleDownloadTemplate = async () => {
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

  const handleBulkUpload = async () => {
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
          errors: response.data.errors || 0,
          errorDetails: response.data.errorDetails || [],
        });
        showSuccess(response.message || `Created ${response.data.created} subtopic(s)`);
        fetchSubtopics();
        fetchTopics();
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

  const handleDeleteAllConfirm = async () => {
    try {
      setIsDeletingAll(true);
      const response = await deleteAllSubtopics();
      if (response.success) {
        showSuccess(response.message || 'All subtopics deleted successfully');
        setShowDeleteAllConfirm(false);
        fetchSubtopics();
      } else {
        showError(response.message || 'Failed to delete all subtopics');
        setShowDeleteAllConfirm(false);
      }
    } catch {
      showError('An error occurred while deleting all subtopics');
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
              <button
                type="button"
                onClick={() => { setShowBulkModal(true); setBulkResult(null); setBulkError(null); setBulkExcelFile(null); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA]"
              >
                <FiUpload className="h-4 w-4" />
                Upload Excel
              </button>
              {canDelete && allSubtopics.length > 0 && (
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

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Exams (optional, max {MAX_EXAMS})
                  </label>
                  <MultiSelect
                    options={availableExams}
                    value={(formData.exam_ids || []).slice(0, MAX_EXAMS).map(String)}
                    onChange={(values) => setFormData({ ...formData, exam_ids: values.map(Number).slice(0, MAX_EXAMS) })}
                    placeholder="Search and select exams..."
                    isSearchable
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                      className="w-4 h-4 text-[#341050] border-slate-300 rounded focus:ring-[#341050]/25"
                    />
                    <span className="text-xs font-medium text-slate-700">Active</span>
                  </label>
                </div>
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
                  disabled={isSubmitting || !formData.topic_id || !formData.name.trim()}
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
                    <label className="block text-xs font-medium text-slate-700 mb-1">Exams</label>
                    <p className="text-sm text-slate-900">
                      {viewingSubtopic.exam_ids!
                        .map((id) => availableExams.find((e) => e.value === String(id))?.label ?? `Exam ${id}`)
                        .join(', ')}
                    </p>
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

      {showBulkModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Bulk Upload Subtopics</h2>
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="text-slate-500 hover:text-slate-800">
                <FiX className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Sample template – Excel format</h3>
                <p className="text-xs text-slate-600 mb-3">Columns: subtopic_name, topic_name (must match an existing topic exactly).</p>
                <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-r border-slate-200">subtopic_name</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700 border-b border-slate-200">topic_name</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-3 py-2 text-slate-800 border-r border-slate-200">Linear Equations</td>
                        <td className="px-3 py-2 text-slate-800">Algebra</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  disabled={downloadingTemplate}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-[#F6F8FA] disabled:opacity-50"
                >
                  <FiDownload className="h-4 w-4" />
                  {downloadingTemplate ? 'Downloading...' : 'Download template'}
                </button>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Upload your Excel file</h3>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setBulkExcelFile(e.target.files?.[0] || null)}
                  className="w-full text-sm border border-slate-300 rounded-lg p-2"
                />
              </div>
              {bulkError && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">{bulkError}</div>}
              {bulkResult && (
                <div className="bg-[#F6F8FA] border border-slate-200 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-700">Created: {bulkResult.created}</p>
                  {bulkResult.errors > 0 && <p className="text-amber-700 mt-1">Errors: {bulkResult.errors} row(s)</p>}
                  {bulkResult.errorDetails?.length > 0 && (
                    <ul className="mt-2 text-xs text-slate-600 max-h-32 overflow-auto">
                      {bulkResult.errorDetails.map((err, i) => (
                        <li key={i}>Row {err.row}: {err.message}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end gap-2">
              <button onClick={() => { setShowBulkModal(false); setBulkExcelFile(null); setBulkResult(null); setBulkError(null); }} className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA]">
                Close
              </button>
              <button onClick={handleBulkUpload} disabled={!bulkExcelFile || bulkUploading} className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 disabled:opacity-50">
                {bulkUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAllConfirm}
        title="Delete All Subtopics"
        message={`Are you sure you want to delete all ${allSubtopics.length} subtopics? This action cannot be undone.`}
        confirmText="Delete All"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeletingAll}
      />
    </div>
  );
}

