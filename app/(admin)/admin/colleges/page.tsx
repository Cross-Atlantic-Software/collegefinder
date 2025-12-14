'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllColleges, createCollege, updateCollege, deleteCollege, College } from '@/api/admin/colleges';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function CollegesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [colleges, setColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCollege, setEditingCollege] = useState<College | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    ranking: null as number | null,
    description: '',
    logo_url: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchColleges();
  }, [router]);

  useEffect(() => {
    if (allColleges.length === 0) {
      setColleges([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setColleges(allColleges);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allColleges.filter(c =>
        c.name.toLowerCase().includes(searchLower) ||
        (c.description && c.description.toLowerCase().includes(searchLower))
      );
      setColleges(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allColleges]);

  const fetchColleges = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getAllColleges();
      if (response.success && response.data) {
        setAllColleges(response.data.colleges);
        setColleges(response.data.colleges);
      } else {
        setError(response.message || 'Failed to fetch colleges');
      }
    } catch (err) {
      setError('An error occurred while fetching colleges');
      console.error('Error fetching colleges:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      ranking: null,
      description: '',
      logo_url: '',
    });
    setLogoFile(null);
    setLogoPreview(null);
    setEditingCollege(null);
    setError(null);
  };

  const handleModalOpen = (college?: College) => {
    if (college) {
      setEditingCollege(college);
      setFormData({
        name: college.name,
        ranking: college.ranking,
        description: college.description || '',
        logo_url: college.logo_url || '',
      });
      setLogoPreview(college.logo_url || null);
      setLogoFile(null);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    try {
      const collegeData: any = {
        name: formData.name,
        ranking: formData.ranking || null,
        description: formData.description || null,
      };

      if (logoFile) {
        collegeData.logo = logoFile;
      } else if (formData.logo_url) {
        collegeData.logo_url = formData.logo_url;
      }

      if (editingCollege) {
        const response = await updateCollege(editingCollege.id, collegeData);
        if (response.success) {
          showSuccess('College updated successfully');
          handleModalClose();
          fetchColleges();
        } else {
          const errorMsg = response.message || 'Failed to update college';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const response = await createCollege(collegeData);
        if (response.success) {
          showSuccess('College created successfully');
          handleModalClose();
          fetchColleges();
        } else {
          const errorMsg = response.message || 'Failed to create college';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving college:', err);
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
      const response = await deleteCollege(deletingId);
      if (response.success) {
        showSuccess('College deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchColleges();
      } else {
        showError(response.message || 'Failed to delete college');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting college');
      console.error('Error deleting college:', err);
    } finally {
      setIsDeleting(false);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Colleges Manager</h1>
            <p className="text-sm text-gray-600">View all colleges.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All colleges</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allColleges.length}
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
              onClick={() => handleModalOpen()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
            >
              <FiPlus className="h-4 w-4" />
              Create College
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Colleges Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading colleges...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        LOGO
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        NAME
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        RANKING
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        DESCRIPTION
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
                    {colleges.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                          {colleges.length < allColleges.length ? 'No colleges found matching your search' : 'No colleges found'}
                        </td>
                      </tr>
                    ) : (
                      colleges.map((college) => (
                        <tr key={college.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            {college.logo_url ? (
                              <img
                                src={college.logo_url}
                                alt={college.name}
                                className="w-12 h-12 object-contain rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                                <span className="text-xs text-gray-400">No logo</span>
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{college.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            {college.ranking ? (
                              <span className="text-sm text-gray-900">#{college.ranking}</span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            {college.description ? (
                              <p className="text-sm text-gray-600 line-clamp-2 max-w-md">
                                {college.description}
                              </p>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(college.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(college.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleModalOpen(college)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(college.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
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

          {/* Create/Edit Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold">
                    {editingCollege ? 'Edit College' : 'Create College'}
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
                    {/* Name (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Ranking */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ranking</label>
                      <input
                        type="number"
                        value={formData.ranking || ''}
                        onChange={(e) => setFormData({ ...formData, ranking: e.target.value ? parseInt(e.target.value) : null })}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="e.g., 1, 2, 3"
                      />
                    </div>

                    {/* Logo Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Logo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                      />
                      {logoPreview && (
                        <div className="mt-2">
                          <img
                            src={logoPreview}
                            alt="Logo preview"
                            className="h-24 w-24 object-contain border border-gray-300 rounded"
                          />
                        </div>
                      )}
                      {!logoPreview && editingCollege?.logo_url && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Current logo:</p>
                          <img
                            src={editingCollege.logo_url}
                            alt="Current logo"
                            className="h-24 w-24 object-contain border border-gray-300 rounded"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="Enter college description..."
                      />
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                        {error}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="mt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleModalClose}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors"
                    >
                      {editingCollege ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
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
            title="Delete College"
            message="Are you sure you want to delete this college? This action cannot be undone."
            confirmText="Delete"
            cancelText="Cancel"
            isLoading={isDeleting}
            confirmButtonStyle="danger"
          />
        </main>
      </div>
    </div>
  );
}

