'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllCollegeGallery, 
  createCollegeGallery, 
  updateCollegeGallery, 
  deleteCollegeGallery,
  CollegeGallery 
} from '@/api/admin/college-gallery';
import { getAllColleges, College } from '@/api/admin/colleges';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiImage } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CollegeGalleryPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [gallery, setGallery] = useState<CollegeGallery[]>([]);
  const [allGallery, setAllGallery] = useState<CollegeGallery[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingImage, setEditingImage] = useState<CollegeGallery | null>(null);
  const [formData, setFormData] = useState({
    college_id: '',
    caption: '',
    sort_order: 0,
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

    fetchData();
  }, [router]);

  useEffect(() => {
    if (allGallery.length === 0) {
      setGallery([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setGallery(allGallery);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allGallery.filter(g =>
        g.college_name?.toLowerCase().includes(searchLower) ||
        (g.caption && g.caption.toLowerCase().includes(searchLower))
      );
      setGallery(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allGallery]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [galleryResponse, collegesResponse] = await Promise.all([
        getAllCollegeGallery(),
        getAllColleges()
      ]);
      
      if (galleryResponse.success && galleryResponse.data) {
        setAllGallery(galleryResponse.data.gallery);
        setGallery(galleryResponse.data.gallery);
      }
      
      if (collegesResponse.success && collegesResponse.data) {
        setColleges(collegesResponse.data.colleges);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      college_id: '',
      caption: '',
      sort_order: 0,
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingImage(null);
    setError(null);
  };

  const handleModalOpen = (image?: CollegeGallery) => {
    if (image) {
      setEditingImage(image);
      setFormData({
        college_id: image.college_id.toString(),
        caption: image.caption || '',
        sort_order: image.sort_order,
      });
      setImagePreview(image.image_url);
      setImageFile(null);
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.college_id) {
      setError('College is required');
      return;
    }

    if (!imageFile && !imagePreview) {
      setError('Image is required');
      return;
    }

    try {
      const imageData: any = {
        college_id: parseInt(formData.college_id),
        caption: formData.caption || null,
        sort_order: formData.sort_order || 0,
      };

      if (imageFile) {
        imageData.image = imageFile;
      }

      let response;
      if (editingImage) {
        response = await updateCollegeGallery(editingImage.id, imageData);
      } else {
        response = await createCollegeGallery(imageData);
      }

      if (response.success) {
        showSuccess(`Gallery image ${editingImage ? 'updated' : 'created'} successfully`);
        handleModalClose();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingImage ? 'update' : 'create'} gallery image`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingImage ? 'updating' : 'creating'} gallery image`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving gallery image:', err);
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
      const response = await deleteCollegeGallery(deletingId);
      if (response.success) {
        showSuccess('Gallery image deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        showError(response.message || 'Failed to delete gallery image');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting gallery image');
      console.error('Error deleting gallery image:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">College Gallery</h1>
                <p className="text-gray-600">Manage college gallery images</p>
              </div>
              <button
                onClick={() => handleModalOpen()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
              >
                <FiPlus className="h-4 w-4" />
                Add Image
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by college name or caption..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* Loading State */}
            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-pink"></div>
                <p className="mt-2 text-gray-600">Loading gallery...</p>
              </div>
            ) : gallery.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiImage className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">No gallery images found</p>
              </div>
            ) : (
              /* Table */
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          College
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Image
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Caption
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sort Order
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {gallery.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.college_name || `College ID: ${item.college_id}`}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.caption || 'Gallery image'}
                                className="h-16 w-16 object-cover rounded"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.caption || <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.sort_order}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleModalOpen(item)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
                    {editingImage ? 'Edit Gallery Image' : 'Add Gallery Image'}
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
                    {/* College (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.college_id}
                        onChange={(value) => setFormData({ ...formData, college_id: value || '' })}
                        options={colleges?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                        placeholder="Select college"
                      />
                    </div>

                    {/* Image Upload (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                      />
                      {imagePreview && (
                        <div className="mt-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="h-32 w-32 object-cover border border-gray-300 rounded"
                          />
                        </div>
                      )}
                    </div>

                    {/* Caption */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
                      <input
                        type="text"
                        value={formData.caption}
                        onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="Enter image caption..."
                      />
                    </div>

                    {/* Sort Order */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="0"
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
                      {editingImage ? 'Update' : 'Create'}
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
            title="Delete Gallery Image"
            message="Are you sure you want to delete this gallery image? This action cannot be undone."
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
