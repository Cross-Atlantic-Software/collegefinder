'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllTopics, createTopic, updateTopic, deleteTopic, Topic } from '@/api';
import { getAllSubjectsPublic } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiImage } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select, SelectOption } from '@/components/shared';

export default function TopicsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [allTopics, setAllTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ 
    sub_id: '', 
    name: '', 
    home_display: false, 
    status: true,
    description: '',
    sort_order: 0
  });
  const [availableSubjects, setAvailableSubjects] = useState<SelectOption[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingTopic, setViewingTopic] = useState<Topic | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchTopics();
    fetchSubjects();
  }, [router]);

  const fetchSubjects = async () => {
    try {
      const response = await getAllSubjectsPublic();
      if (response.success && response.data) {
        setAvailableSubjects(
          response.data.subjects.map((s) => ({
            value: String(s.id),
            label: s.name,
          }))
        );
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    if (allTopics.length === 0) {
      setTopics([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setTopics(allTopics);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allTopics.filter(topic =>
        topic.name.toLowerCase().includes(searchLower)
      );
      setTopics(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allTopics]);

  const fetchTopics = async () => {
    try {
      setIsLoading(true);
      const response = await getAllTopics();
      if (response.success && response.data) {
        setAllTopics(response.data.topics);
        setTopics(response.data.topics);
      } else {
        setError(response.message || 'Failed to fetch topics');
      }
    } catch (err) {
      setError('An error occurred while fetching topics');
      console.error('Error fetching topics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('sub_id', formData.sub_id);
      formDataToSend.append('name', formData.name);
      formDataToSend.append('home_display', String(formData.home_display));
      formDataToSend.append('status', String(formData.status));
      formDataToSend.append('description', formData.description || '');
      formDataToSend.append('sort_order', String(formData.sort_order));

      if (thumbnailFile) {
        formDataToSend.append('thumbnail', thumbnailFile);
      }

      let response;
      if (editingTopic) {
        response = await updateTopic(editingTopic.id, formDataToSend);
      } else {
        response = await createTopic(formDataToSend);
      }

      if (response.success) {
        showSuccess(editingTopic ? 'Topic updated successfully' : 'Topic created successfully');
        fetchTopics();
        handleModalClose();
      } else {
        setError(response.message || 'Failed to save topic');
        showError(response.message || 'Failed to save topic');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while saving topic';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreate = () => {
    setEditingTopic(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (topic: Topic) => {
    setEditingTopic(topic);
    setFormData({
      sub_id: String(topic.sub_id),
      name: topic.name,
      home_display: topic.home_display,
      status: topic.status,
      description: topic.description || '',
      sort_order: topic.sort_order
    });
    setThumbnailPreview(topic.thumbnail);
    setThumbnailFile(null);
    setShowModal(true);
  };

  const handleView = (topic: Topic) => {
    setViewingTopic(topic);
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
      const response = await deleteTopic(deletingId);
      if (response.success) {
        showSuccess('Topic deleted successfully');
        fetchTopics();
      } else {
        showError(response.message || 'Failed to delete topic');
      }
    } catch (err: any) {
      showError(err.message || 'Failed to delete topic');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({ 
      sub_id: '', 
      name: '', 
      home_display: false, 
      status: true,
      description: '',
      sort_order: 0
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTopic(null);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Topics Manager</h1>
            <p className="text-sm text-gray-600">Manage topics that belong to subjects.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All topics</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allTopics.length}
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
              Add Topic
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Topics Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading topics...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">THUMBNAIL</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">SUBJECT</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">HOME DISPLAY</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">STATUS</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topics.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                          {topics.length < allTopics.length ? 'No topics found matching your search' : 'No topics found'}
                        </td>
                      </tr>
                    ) : (
                      topics.map((topic) => {
                        const subject = availableSubjects.find((s) => s.value === String(topic.sub_id));
                        return (
                          <tr key={topic.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              {topic.thumbnail ? (
                                <img
                                  src={topic.thumbnail}
                                  alt={topic.name}
                                  className="w-12 h-12 object-cover rounded"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                  <FiImage className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm font-medium text-gray-900">{topic.name}</span>
                            </td>
                            <td className="px-4 py-2">
                              <span className="text-sm text-gray-600">{subject?.label || `Subject ${topic.sub_id}`}</span>
                            </td>
                            <td className="px-4 py-2">
                              {topic.home_display ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {topic.status ? (
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
                              {new Date(topic.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleView(topic)}
                                  className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                  title="View"
                                >
                                  <FiEye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleEdit(topic)}
                                  className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                  title="Edit"
                                >
                                  <FiEdit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(topic.id)}
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

      {/* Topic Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingTopic ? 'Edit Topic' : 'Create Topic'}
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
                    Subject <span className="text-pink">*</span>
                  </label>
                  <Select
                    options={availableSubjects}
                    value={formData.sub_id}
                    onChange={(value) => setFormData({ ...formData, sub_id: value || '' })}
                    placeholder="Select subject"
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
                    placeholder="e.g., Algebra, Geometry, Calculus"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Thumbnail
                  </label>
                  {thumbnailPreview && (
                    <div className="mb-2">
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleThumbnailChange}
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

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.home_display}
                      onChange={(e) => setFormData({ ...formData, home_display: e.target.checked })}
                      className="w-4 h-4 text-pink border-gray-300 rounded focus:ring-pink"
                    />
                    <span className="text-xs font-medium text-gray-700">Home Display</span>
                  </label>

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
                  {isSubmitting ? 'Saving...' : editingTopic ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingTopic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Topic Details</h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                {viewingTopic.thumbnail && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Thumbnail</label>
                    <img src={viewingTopic.thumbnail} alt={viewingTopic.name} className="w-48 h-32 object-cover rounded border border-gray-200" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{viewingTopic.name}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Subject</label>
                  <p className="text-sm text-gray-900">
                    {availableSubjects.find((s) => s.value === String(viewingTopic.sub_id))?.label || `Subject ${viewingTopic.sub_id}`}
                  </p>
                </div>
                {viewingTopic.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900">{viewingTopic.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Home Display</label>
                    <p className="text-sm text-gray-900">{viewingTopic.home_display ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                    <p className="text-sm text-gray-900">{viewingTopic.status ? 'Active' : 'Inactive'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                    <p className="text-sm text-gray-900">{viewingTopic.sort_order}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingTopic.created_at).toLocaleString()}
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
        title="Delete Topic"
        message="Are you sure you want to delete this topic? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}

