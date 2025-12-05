'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllCareerGoalsAdmin, createCareerGoal, updateCareerGoal, deleteCareerGoal, uploadCareerGoalLogo, CareerGoalAdmin } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiUpload, FiX } from 'react-icons/fi';
import Image from 'next/image';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function CareerGoalsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [careerGoals, setCareerGoals] = useState<CareerGoalAdmin[]>([]);
  const [allCareerGoals, setAllCareerGoals] = useState<CareerGoalAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCareerGoal, setEditingCareerGoal] = useState<CareerGoalAdmin | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ label: '', logo: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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

    fetchCareerGoals();
  }, [router]);

  useEffect(() => {
    if (allCareerGoals.length === 0) {
      setCareerGoals([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setCareerGoals(allCareerGoals);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allCareerGoals.filter(cg =>
        cg.label.toLowerCase().includes(searchLower)
      );
      setCareerGoals(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allCareerGoals]);

  const fetchCareerGoals = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCareerGoalsAdmin();
      if (response.success && response.data) {
        setAllCareerGoals(response.data.careerGoals);
        setCareerGoals(response.data.careerGoals);
      } else {
        setError(response.message || 'Failed to fetch career goals');
      }
    } catch (err) {
      setError('An error occurred while fetching career goals');
      console.error('Error fetching career goals:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    try {
      setUploading(true);
      const response = await uploadCareerGoalLogo(file);
      if (response.success && response.data) {
        setFormData({ ...formData, logo: response.data.logoUrl });
        setLogoPreview(response.data.logoUrl);
        setError(null);
        showSuccess('Logo uploaded successfully');
      } else {
        const errorMsg = response.message || 'Failed to upload logo';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while uploading logo';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error uploading logo:', err);
    } finally {
      setUploading(false);
    }
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
      handleLogoUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.label || !formData.logo) {
      setError('Label and logo are required');
      return;
    }

    try {
      if (editingCareerGoal) {
        const response = await updateCareerGoal(editingCareerGoal.id, formData);
        if (response.success) {
          showSuccess('Career goal updated successfully');
          setShowModal(false);
          resetForm();
          fetchCareerGoals();
        } else {
          const errorMsg = response.message || 'Failed to update career goal';
          setError(errorMsg);
          showError(errorMsg);
        }
      } else {
        const response = await createCareerGoal(formData);
        if (response.success) {
          showSuccess('Career goal created successfully');
          setShowModal(false);
          resetForm();
          fetchCareerGoals();
        } else {
          const errorMsg = response.message || 'Failed to create career goal';
          setError(errorMsg);
          showError(errorMsg);
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving career goal';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving career goal:', err);
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
      const response = await deleteCareerGoal(deletingId);
      if (response.success) {
        showSuccess('Career goal deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchCareerGoals();
      } else {
        const errorMsg = response.message || 'Failed to delete career goal';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting career goal';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting career goal:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (careerGoal: CareerGoalAdmin) => {
    setEditingCareerGoal(careerGoal);
    setFormData({ label: careerGoal.label, logo: careerGoal.logo });
    setLogoPreview(careerGoal.logo);
    setLogoFile(null);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingCareerGoal(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ label: '', logo: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingCareerGoal(null);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Career Goals Manager</h1>
            <p className="text-sm text-gray-600">Manage career goal options that users can select.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All goals</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allCareerGoals.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by label"
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
              Add Career Goal
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Career Goals Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading career goals...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        LOGO
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        LABEL
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
                    {careerGoals.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {careerGoals.length < allCareerGoals.length ? 'No career goals found matching your search' : 'No career goals found'}
                        </td>
                      </tr>
                    ) : (
                      careerGoals.map((cg) => (
                        <tr key={cg.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <div className="h-12 w-12 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                              {cg.logo ? (
                                <Image
                                  src={cg.logo}
                                  alt={cg.label}
                                  width={48}
                                  height={48}
                                  className="object-contain"
                                />
                              ) : (
                                <span className="text-xs text-gray-400">No logo</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{cg.label}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(cg.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(cg.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(cg)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(cg.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
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

      {/* Career Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingCareerGoal ? 'Edit Career Goal' : 'Create Career Goal'}
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
                    Label <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    required
                    placeholder="e.g., Technology, Design"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Logo <span className="text-pink">*</span>
                  </label>
                  <div className="space-y-2">
                    {logoPreview && (
                      <div className="relative h-32 w-32 rounded-md overflow-hidden bg-gray-100 border border-gray-300">
                        <Image
                          src={logoPreview}
                          alt="Preview"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                      <FiUpload className="h-4 w-4" />
                      <span>
                        {editingCareerGoal && logoPreview && !logoFile 
                          ? 'Update Logo' 
                          : logoPreview 
                            ? 'Change Logo' 
                            : 'Upload Logo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {uploading && (
                      <p className="text-xs text-gray-500">Uploading...</p>
                    )}
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
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
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
                disabled={uploading || !formData.label || !formData.logo}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingCareerGoal ? 'Update' : 'Create'}
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
        title="Delete Career Goal"
        message="Are you sure you want to delete this career goal? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

