'use client';

import { useState, useEffect } from 'react';
import { FiX, FiUpload, FiEdit2, FiTrash2, FiPlus } from 'react-icons/fi';
import Image from 'next/image';
import { getAllCareerGoalsAdmin, createCareerGoal, updateCareerGoal, deleteCareerGoal, uploadCareerGoalLogo, CareerGoalAdmin } from '@/api';

interface CareerGoalsTaxonomyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CareerGoalsTaxonomyModal({ isOpen, onClose }: CareerGoalsTaxonomyModalProps) {
  const [careerGoals, setCareerGoals] = useState<CareerGoalAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCareerGoal, setEditingCareerGoal] = useState<CareerGoalAdmin | null>(null);
  const [formData, setFormData] = useState({ label: '', logo: '' });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCareerGoals();
    }
  }, [isOpen]);

  const fetchCareerGoals = async () => {
    try {
      setIsLoading(true);
      const response = await getAllCareerGoalsAdmin();
      if (response.success && response.data) {
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
      } else {
        setError(response.message || 'Failed to upload logo');
      }
    } catch (err) {
      setError('An error occurred while uploading logo');
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
          setShowForm(false);
          resetForm();
          fetchCareerGoals();
        } else {
          setError(response.message || 'Failed to update career goal');
        }
      } else {
        const response = await createCareerGoal(formData);
        if (response.success) {
          setShowForm(false);
          resetForm();
          fetchCareerGoals();
        } else {
          setError(response.message || 'Failed to create career goal');
        }
      }
    } catch (err) {
      setError('An error occurred while saving career goal');
      console.error('Error saving career goal:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this career goal taxonomy? This will remove it from all users who have selected it.')) return;

    try {
      const response = await deleteCareerGoal(id);
      if (response.success) {
        fetchCareerGoals();
      } else {
        setError(response.message || 'Failed to delete career goal');
      }
    } catch (err) {
      setError('An error occurred while deleting career goal');
      console.error('Error deleting career goal:', err);
    }
  };

  const handleEdit = (careerGoal: CareerGoalAdmin) => {
    setEditingCareerGoal(careerGoal);
    setFormData({ label: careerGoal.label, logo: careerGoal.logo });
    setLogoPreview(careerGoal.logo);
    setLogoFile(null);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingCareerGoal(null);
    resetForm();
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({ label: '', logo: '' });
    setLogoFile(null);
    setLogoPreview(null);
    setError(null);
  };

  const handleClose = () => {
    setShowForm(false);
    setEditingCareerGoal(null);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-bold">Career Goals Taxonomies</h2>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {showForm ? (
            /* Form View */
            <form onSubmit={handleSubmit} className="space-y-4">
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
                        unoptimized
                      />
                    </div>
                  )}
                  <label className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <FiUpload className="h-4 w-4" />
                    <span>{logoFile ? 'Change Logo' : 'Upload Logo'}</span>
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

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !formData.label || !formData.logo}
                  className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingCareerGoal ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          ) : (
            /* List View */
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-gray-900">All Taxonomies</h3>
                <button
                  onClick={handleCreate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Taxonomy
                </button>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  {error}
                </div>
              )}

              {isLoading ? (
                <div className="text-center text-sm text-gray-500 py-8">Loading taxonomies...</div>
              ) : careerGoals.length === 0 ? (
                <div className="text-center text-sm text-gray-500 py-8">No taxonomies found</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {careerGoals.map((cg) => (
                    <div
                      key={cg.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                          {cg.logo ? (
                            <Image
                              src={cg.logo}
                              alt={cg.label}
                              width={64}
                              height={64}
                              unoptimized
                              className="object-contain"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No logo</span>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEdit(cg)}
                            className="p-1.5 text-blue-600 hover:text-blue-800 transition-colors"
                            title="Edit"
                          >
                            <FiEdit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(cg.id)}
                            className="p-1.5 text-red-600 hover:text-red-800 transition-colors"
                            title="Delete"
                          >
                            <FiTrash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">{cg.label}</h4>
                      <p className="text-xs text-gray-500 mt-1">ID: {cg.id}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

