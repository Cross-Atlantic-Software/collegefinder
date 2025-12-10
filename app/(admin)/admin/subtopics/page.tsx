'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllSubtopics, getSubtopicsByTopicId, createSubtopic, updateSubtopic, deleteSubtopic, Subtopic } from '@/api';
import { getAllTopics } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select, SelectOption } from '@/components/shared';

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
    sort_order: 0
  });
  const [availableTopics, setAvailableTopics] = useState<SelectOption[]>([]);
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
  }, [router]);

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
    setIsSubmitting(true);

    try {
      const data = {
        topic_id: parseInt(formData.topic_id),
        name: formData.name,
        status: formData.status,
        description: formData.description || undefined,
        sort_order: formData.sort_order
      };

      let response;
      if (editingSubtopic) {
        response = await updateSubtopic(editingSubtopic.id, data);
      } else {
        response = await createSubtopic(data);
      }

      if (response.success) {
        showSuccess(editingSubtopic ? 'Subtopic updated successfully' : 'Subtopic created successfully');
        fetchSubtopics();
        handleModalClose();
      } else {
        setError(response.message || 'Failed to save subtopic');
        showError(response.message || 'Failed to save subtopic');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while saving subtopic';
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
      status: subtopic.status,
      description: subtopic.description || '',
      sort_order: subtopic.sort_order
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
      sort_order: 0
    });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingSubtopic(null);
    resetForm();
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Subtopics Manager</h1>
            <p className="text-sm text-gray-600">Manage subtopics that belong to topics.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All subtopics</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allSubtopics.length}
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
            <button
              onClick={handleCreate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              Add Subtopic
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Subtopics Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading subtopics...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">TOPIC</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {subtopics.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {subtopics.length < allSubtopics.length ? 'No subtopics found matching your search' : 'No subtopics found'}
                        </td>
                      </tr>
                    ) : (
                      subtopics.map((subtopic) => {
                        const topic = availableTopics.find((t) => t.value === String(subtopic.topic_id));
                        return (
                          <tr key={subtopic.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900">{subtopic.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-gray-600">{topic?.label || `Topic ${subtopic.topic_id}`}</span>
                            </td>
                            <td className="px-4 py-2">
                              {subtopic.status ? (
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
                              {new Date(subtopic.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleView(subtopic)}
                                  className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                  title="View"
                                >
                                  <FiEye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(subtopic)}
                                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(subtopic.id)}
                                  className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                  title="Delete"
                                >
                                  <FiTrash2 className="h-4 w-4" />
                                </button>
                              </div>
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingSubtopic ? 'Edit Subtopic' : 'Create Subtopic'}
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
                    Topic <span className="text-pink">*</span>
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., Linear Equations, Quadratic Equations"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    min="0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                      className="w-4 h-4 text-pink border-gray-300 rounded focus:ring-pink"
                    />
                    <span className="text-xs font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleModalClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-darkGradient rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Subtopic Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{viewingSubtopic.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Topic</label>
                  <p className="text-sm text-gray-900">
                    {availableTopics.find((t) => t.value === String(viewingSubtopic.topic_id))?.label || `Topic ${viewingSubtopic.topic_id}`}
                  </p>
                </div>
                {viewingSubtopic.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{viewingSubtopic.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{viewingSubtopic.status ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                    <p className="text-sm text-gray-900">{viewingSubtopic.sort_order}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
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
    </div>
  );
}

