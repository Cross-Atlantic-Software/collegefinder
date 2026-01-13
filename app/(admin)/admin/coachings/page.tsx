'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCoachings,
  createCoaching,
  updateCoaching,
  deleteCoaching,
  Coaching
} from '@/api/admin/coachings';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiImage } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function CoachingsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [allCoachings, setAllCoachings] = useState<Coaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoaching, setEditingCoaching] = useState<Coaching | null>(null);
  const [viewingCoaching, setViewingCoaching] = useState<Coaching | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchCoachings();
  }, [router]);

  useEffect(() => {
    if (allCoachings.length === 0) {
      setCoachings([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setCoachings(allCoachings);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allCoachings.filter(coaching =>
        coaching.name.toLowerCase().includes(searchLower) ||
        (coaching.description && coaching.description.toLowerCase().includes(searchLower))
      );
      setCoachings(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCoachings]);

  const fetchCoachings = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCoachings();
      if (response.success && response.data) {
        setAllCoachings(response.data.coachings);
        setCoachings(response.data.coachings);
      } else {
        setError(response.message || 'Failed to fetch coachings');
      }
    } catch (err) {
      setError('An error occurred while fetching coachings');
      console.error('Error fetching coachings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Coaching name is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const coachingData = new FormData();
      coachingData.append('name', formData.name);
      coachingData.append('description', formData.description || '');

      if (logoFile) {
        coachingData.append('logo', logoFile);
      }

      let response;
      if (editingCoaching) {
        response = await updateCoaching(editingCoaching.id, coachingData);
      } else {
        response = await createCoaching(coachingData);
      }

      if (response.success) {
        showSuccess(editingCoaching ? 'Coaching updated successfully' : 'Coaching created successfully');
        setShowModal(false);
        resetForm();
        fetchCoachings();
      } else {
        const errorMsg = response.message || `Failed to ${editingCoaching ? 'update' : 'create'} coaching`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingCoaching ? 'updating' : 'creating'} coaching`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving coaching:', err);
    } finally {
      setIsSubmitting(false);
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
      const response = await deleteCoaching(deletingId);
      if (response.success) {
        showSuccess('Coaching deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchCoachings();
      } else {
        const errorMsg = response.message || 'Failed to delete coaching';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting coaching';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting coaching:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (coaching: Coaching) => {
    setEditingCoaching(coaching);
    setFormData({
      name: coaching.name,
      description: coaching.description || '',
    });
    setLogoFile(null);
    setLogoPreview(coaching.logo);
    setShowModal(true);
  };

  const handleView = (coaching: Coaching) => {
    setViewingCoaching(coaching);
  };

  const handleCreate = () => {
    setEditingCoaching(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
    });
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCoaching(null);
    setViewingCoaching(null);
    resetForm();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setLogoPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        showError('Please select an image file');
      }
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Coachings Manager</h1>
            <p className="text-sm text-gray-600">Manage coaching centers and their information.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All coachings</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allCoachings.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or description"
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
              Add Coaching
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Coachings Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading coachings...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">LOGO</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">DESCRIPTION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CREATED</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coachings.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {coachings.length < allCoachings.length ? 'No coachings found matching your search' : 'No coachings found'}
                        </td>
                      </tr>
                    ) : (
                      coachings.map((coaching) => (
                        <tr key={coaching.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            {coaching.logo ? (
                              <img
                                src={coaching.logo}
                                alt={coaching.name}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <FiImage className="h-5 w-5 text-gray-400" />
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{coaching.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700 line-clamp-2 max-w-xs">
                              {coaching.description || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(coaching.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleView(coaching)}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleEdit(coaching)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(coaching.id)}
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

      {/* Coaching Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCoaching ? 'Edit Coaching' : 'Create Coaching'}
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
                    placeholder="e.g., ABC Coaching Institute"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Logo
                  </label>
                  {logoPreview && (
                    <div className="mb-2">
                      <img
                        src={logoPreview}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Upload a logo image (optional)</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description"
                    rows={4}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
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
                  {isSubmitting ? 'Saving...' : editingCoaching ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingCoaching && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Coaching Details</h2>
              <button
                onClick={() => setViewingCoaching(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="space-y-4">
                {viewingCoaching.logo && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Logo</label>
                    <img src={viewingCoaching.logo} alt={viewingCoaching.name} className="w-32 h-32 object-cover rounded border border-gray-200" />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                  <p className="text-sm text-gray-900">{viewingCoaching.name}</p>
                </div>
                {viewingCoaching.description && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                    <p className="text-sm text-gray-900 whitespace-pre-wrap">{viewingCoaching.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingCoaching.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                    <p className="text-sm text-gray-900">
                      {new Date(viewingCoaching.updated_at).toLocaleString()}
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
        onConfirm={handleDeleteConfirm}
        title="Delete Coaching"
        message="Are you sure you want to delete this coaching center? This action cannot be undone and will also delete all related locations, gallery images, and courses."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}
