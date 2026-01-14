'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllCoachingGallery,
  getGalleryByCoachingId,
  createCoachingGallery,
  updateCoachingGallery,
  deleteCoachingGallery,
  CoachingGalleryItem
} from '@/api/admin/coaching-gallery';
import { getAllCoachings, Coaching } from '@/api/admin/coachings';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiImage, FiUpload } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CoachingGalleryPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [galleryItems, setGalleryItems] = useState<CoachingGalleryItem[]>([]);
  const [allGalleryItems, setAllGalleryItems] = useState<CoachingGalleryItem[]>([]);
  const [coachings, setCoachings] = useState<Coaching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGalleryItem, setEditingGalleryItem] = useState<CoachingGalleryItem | null>(null);
  const [viewingGalleryItem, setViewingGalleryItem] = useState<CoachingGalleryItem | null>(null);
  const [formData, setFormData] = useState({
    coaching_id: '',
    caption: '',
    sort_order: '',
  });
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [galleryPreview, setGalleryPreview] = useState<string | null>(null);
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

    fetchData();
  }, [router]);

  useEffect(() => {
    if (allGalleryItems.length === 0) {
      setGalleryItems([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setGalleryItems(allGalleryItems);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allGalleryItems.filter(item =>
        item.caption?.toLowerCase().includes(searchLower) ||
        item.coaching_name?.toLowerCase().includes(searchLower)
      );
      setGalleryItems(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allGalleryItems]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [galleryRes, coachingsRes] = await Promise.all([
        getAllCoachingGallery(),
        getAllCoachings(),
      ]);

      if (galleryRes.success && galleryRes.data) {
        setAllGalleryItems(galleryRes.data.gallery);
        setGalleryItems(galleryRes.data.gallery);
      }
      if (coachingsRes.success && coachingsRes.data) {
        setCoachings(coachingsRes.data.coachings);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.coaching_id) {
      setError('Coaching selection is required');
      return;
    }

    if (!galleryFile && !editingGalleryItem) {
      setError('Image file is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const galleryData = new FormData();
      galleryData.append('coaching_id', formData.coaching_id);
      galleryData.append('caption', formData.caption || '');
      galleryData.append('sort_order', formData.sort_order || '0');

      if (galleryFile) {
        galleryData.append('image', galleryFile);
      }

      let response;
      if (editingGalleryItem) {
        response = await updateCoachingGallery(editingGalleryItem.id, galleryData);
      } else {
        response = await createCoachingGallery(galleryData);
      }

      if (response.success) {
        showSuccess(editingGalleryItem ? 'Gallery item updated successfully' : 'Gallery item created successfully');
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingGalleryItem ? 'update' : 'create'} gallery item`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingGalleryItem ? 'updating' : 'creating'} gallery item`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving gallery item:', err);
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
      const response = await deleteCoachingGallery(deletingId);
      if (response.success) {
        showSuccess('Gallery item deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete gallery item';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting gallery item';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting gallery item:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (galleryItem: CoachingGalleryItem) => {
    setEditingGalleryItem(galleryItem);
    setFormData({
      coaching_id: galleryItem.coaching_id.toString(),
      caption: galleryItem.caption || '',
      sort_order: galleryItem.sort_order.toString(),
    });
    setGalleryFile(null);
    setGalleryPreview(galleryItem.image_url);
    setShowModal(true);
  };

  const handleView = (galleryItem: CoachingGalleryItem) => {
    setViewingGalleryItem(galleryItem);
  };

  const handleCreate = () => {
    setEditingGalleryItem(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      coaching_id: '',
      caption: '',
      sort_order: '',
    });
    setGalleryFile(null);
    setGalleryPreview(null);
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingGalleryItem(null);
    setViewingGalleryItem(null);
    resetForm();
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith('image/')) {
        setGalleryFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreview(reader.result as string);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Coaching Gallery Manager</h1>
            <p className="text-sm text-gray-600">Manage coaching center gallery images.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All gallery items</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allGalleryItems.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by coaching or caption..."
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
              Add Image
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Gallery Grid */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading gallery...</div>
            ) : (
              <div className="p-4">
                {galleryItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FiImage className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No gallery items</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {galleryItems.length < allGalleryItems.length ? 'No items found matching your search' : 'Get started by adding some images to the gallery.'}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {galleryItems.map((item) => (
                      <div key={item.id} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={item.image_url}
                            alt={item.caption || 'Gallery image'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200">
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => handleView(item)}
                                className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/30 transition-colors"
                                title="View"
                              >
                                <FiEye className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/30 transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(item.id)}
                                className="p-1.5 bg-white/20 backdrop-blur-sm rounded text-white hover:bg-white/30 transition-colors"
                                title="Delete"
                              >
                                <FiTrash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-900 truncate">
                            {item.coaching_name || `Coaching ${item.coaching_id}`}
                          </p>
                          {item.caption && (
                            <p className="text-xs text-gray-600 truncate">{item.caption}</p>
                          )}
                          <p className="text-xs text-gray-500">Sort: {item.sort_order}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Gallery Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingGalleryItem ? 'Edit Gallery Item' : 'Add Gallery Image'}
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
                    Coaching <span className="text-pink">*</span>
                  </label>
                  <Select
                    value={formData.coaching_id}
                    onChange={(value) => setFormData({ ...formData, coaching_id: value || '' })}
                    options={coachings?.map(c => ({ value: c.id.toString(), label: c.name })) || []}
                    placeholder="Select coaching center"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Image {!editingGalleryItem && <span className="text-pink">*</span>}
                  </label>
                  {galleryPreview && (
                    <div className="mb-2">
                      <img
                        src={galleryPreview}
                        alt="Preview"
                        className="w-48 h-32 object-cover rounded border border-gray-300"
                      />
                    </div>
                  )}
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleGalleryChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      required={!editingGalleryItem}
                    />
                    <div className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink transition-colors">
                      <div className="text-center">
                        <FiUpload className="mx-auto h-8 w-8 text-gray-400" />
                        <p className="mt-1 text-sm text-gray-500">
                          {galleryPreview ? 'Click to change image' : 'Click to upload image'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Caption
                  </label>
                  <input
                    type="text"
                    value={formData.caption}
                    onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                    placeholder="Optional caption for the image"
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
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    placeholder="0"
                    min="0"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first (default: 0)</p>
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
                  {isSubmitting ? 'Saving...' : editingGalleryItem ? 'Update' : 'Add Image'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingGalleryItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Gallery Item Details</h2>
              <button
                onClick={() => setViewingGalleryItem(null)}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto">
              <div className="flex gap-6">
                <div className="flex-shrink-0">
                  <img
                    src={viewingGalleryItem.image_url}
                    alt={viewingGalleryItem.caption || 'Gallery image'}
                    className="w-64 h-64 object-cover rounded-lg border border-gray-200"
                  />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Coaching</label>
                    <p className="text-sm text-gray-900">{viewingGalleryItem.coaching_name || `Coaching ${viewingGalleryItem.coaching_id}`}</p>
                  </div>
                  {viewingGalleryItem.caption && (
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Caption</label>
                      <p className="text-sm text-gray-900">{viewingGalleryItem.caption}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                    <p className="text-sm text-gray-900">{viewingGalleryItem.sort_order}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Created</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingGalleryItem.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Updated</label>
                      <p className="text-sm text-gray-900">
                        {new Date(viewingGalleryItem.updated_at).toLocaleString()}
                      </p>
                    </div>
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
        title="Delete Gallery Item"
        message="Are you sure you want to delete this gallery image? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}
