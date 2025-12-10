'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllStreams, createStream, updateStream, deleteStream, Stream } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function StreamsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [allStreams, setAllStreams] = useState<Stream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingStream, setEditingStream] = useState<Stream | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', status: true });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingStream, setViewingStream] = useState<Stream | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchStreams();
  }, [router]);

  useEffect(() => {
    if (allStreams.length === 0) {
      setStreams([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setStreams(allStreams);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allStreams.filter(stream =>
        stream.name.toLowerCase().includes(searchLower)
      );
      setStreams(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allStreams]);

  const fetchStreams = async () => {
    try {
      setIsLoading(true);
      const response = await getAllStreams();
      if (response.success && response.data) {
        setAllStreams(response.data.streams);
        setStreams(response.data.streams);
      } else {
        setError(response.message || 'Failed to fetch streams');
      }
    } catch (err) {
      setError('An error occurred while fetching streams');
      console.error('Error fetching streams:', err);
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
      if (editingStream) {
        const response = await updateStream(editingStream.id, formData);
        if (response.success) {
          showSuccess('Stream updated successfully');
          setShowModal(false);
          resetForm();
          fetchStreams();
        } else {
          const errorMsg = response.message || 'Failed to update stream';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const response = await createStream(formData);
        if (response.success) {
          showSuccess('Stream created successfully');
          setShowModal(false);
          resetForm();
          fetchStreams();
        } else {
          const errorMsg = response.message || 'Failed to create stream';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving stream';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving stream:', err);
    }
  };

  const handleView = (stream: Stream) => {
    setViewingStream(stream);
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
      const response = await deleteStream(deletingId);
      if (response.success) {
        showSuccess('Stream deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchStreams();
      } else {
        const errorMsg = response.message || 'Failed to delete stream';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting stream';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting stream:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (stream: Stream) => {
    setEditingStream(stream);
    setFormData({ name: stream.name, status: stream.status });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingStream(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', status: true });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingStream(null);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Streams Manager</h1>
            <p className="text-sm text-gray-600">Manage stream options that users can select.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All streams</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allStreams.length}
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
              Add Stream
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Streams Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading streams...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        NAME
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
                    {streams.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {streams.length < allStreams.length ? 'No streams found matching your search' : 'No streams found'}
                        </td>
                      </tr>
                    ) : (
                      streams.map((stream) => (
                        <tr key={stream.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{stream.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            {stream.status ? (
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
                            {new Date(stream.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(stream.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(stream)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(stream)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(stream.id)}
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

      {/* Stream Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingStream ? 'Edit Stream' : 'Create Stream'}
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
                    placeholder="e.g., Science, Commerce, Arts"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
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
                {editingStream ? 'Update' : 'Create'}
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
        title="Delete Stream"
        message="Are you sure you want to delete this stream? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      {/* View Stream Modal */}
      {showViewModal && viewingStream && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">View Stream</h2>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  setViewingStream(null);
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
                <p className="text-lg font-bold text-gray-900">{viewingStream.name}</p>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Status</label>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  viewingStream.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {viewingStream.status ? 'Active' : 'Inactive'}
                </span>
              </div>

              {/* Created At */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Created At</label>
                <p className="text-sm text-gray-700">
                  {new Date(viewingStream.created_at).toLocaleString('en-US', {
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
                  {new Date(viewingStream.updated_at).toLocaleString('en-US', {
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
                  setViewingStream(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEdit(viewingStream);
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

