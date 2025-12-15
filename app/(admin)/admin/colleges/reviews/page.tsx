'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllCollegeReviews, 
  createCollegeReview, 
  updateCollegeReview, 
  deleteCollegeReview,
  CollegeReview 
} from '@/api/admin/college-reviews';
import { getAllColleges, College } from '@/api/admin/colleges';
import { getAllUsers } from '@/api/admin/users';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiStar } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

interface User {
  id: number;
  name?: string;
  email?: string;
}

export default function CollegeReviewsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [reviews, setReviews] = useState<CollegeReview[]>([]);
  const [allReviews, setAllReviews] = useState<CollegeReview[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingReview, setEditingReview] = useState<CollegeReview | null>(null);
  const [formData, setFormData] = useState({
    college_id: '',
    user_id: '',
    rating: 5,
    review_text: '',
    is_approved: false,
  });
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
    if (allReviews.length === 0) {
      setReviews([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setReviews(allReviews);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allReviews.filter(r =>
        r.college_name?.toLowerCase().includes(searchLower) ||
        r.user_name?.toLowerCase().includes(searchLower) ||
        r.user_email?.toLowerCase().includes(searchLower) ||
        (r.review_text && r.review_text.toLowerCase().includes(searchLower))
      );
      setReviews(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allReviews]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [reviewsResponse, collegesResponse, usersResponse] = await Promise.all([
        getAllCollegeReviews(),
        getAllColleges(),
        getAllUsers()
      ]);
      
      if (reviewsResponse.success && reviewsResponse.data) {
        setAllReviews(reviewsResponse.data.reviews);
        setReviews(reviewsResponse.data.reviews);
      }
      
      if (collegesResponse.success && collegesResponse.data) {
        setColleges(collegesResponse.data.colleges);
      }
      
      if (usersResponse.success && usersResponse.data) {
        setUsers((usersResponse.data.users || []).map(u => ({ ...u, name: u.name || undefined })));
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
      user_id: '',
      rating: 5,
      review_text: '',
      is_approved: false,
    });
    setEditingReview(null);
    setError(null);
  };

  const handleModalOpen = (review?: CollegeReview) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        college_id: review.college_id.toString(),
        user_id: review.user_id.toString(),
        rating: review.rating,
        review_text: review.review_text || '',
        is_approved: review.is_approved,
      });
    } else {
      resetForm();
    }
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.college_id || !formData.user_id) {
      setError('College and User are required');
      return;
    }

    if (formData.rating < 1 || formData.rating > 5) {
      setError('Rating must be between 1 and 5');
      return;
    }

    try {
      const reviewData: any = {
        college_id: parseInt(formData.college_id),
        user_id: parseInt(formData.user_id),
        rating: formData.rating,
        review_text: formData.review_text.trim() || null,
        is_approved: formData.is_approved,
      };

      let response;
      if (editingReview) {
        response = await updateCollegeReview(editingReview.id, reviewData);
      } else {
        response = await createCollegeReview(reviewData);
      }

      if (response.success) {
        showSuccess(`Review ${editingReview ? 'updated' : 'created'} successfully`);
        handleModalClose();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingReview ? 'update' : 'create'} review`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingReview ? 'updating' : 'creating'} review`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving review:', err);
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
      const response = await deleteCollegeReview(deletingId);
      if (response.success) {
        showSuccess('Review deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        showError(response.message || 'Failed to delete review');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting review');
      console.error('Error deleting review:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        size={16}
      />
    ));
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">College Reviews</h1>
                <p className="text-gray-600">Manage college reviews</p>
              </div>
              <button
                onClick={() => handleModalOpen()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
              >
                <FiPlus className="h-4 w-4" />
                Add Review
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by college name, user name, email, or review text..."
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
                <p className="mt-2 text-gray-600">Loading reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiStar className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">No reviews found</p>
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
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Rating
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Review Text
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Approved
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
                      {reviews.map((review) => (
                        <tr key={review.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {review.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {review.college_name || `College ID: ${review.college_id}`}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            <div>
                              <div className="font-medium">{review.user_name || `User ID: ${review.user_id}`}</div>
                              {review.user_email && (
                                <div className="text-gray-500 text-xs">{review.user_email}</div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {renderStars(review.rating)}
                              <span className="ml-1 text-sm text-gray-700">({review.rating})</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700 max-w-xs">
                            {review.review_text ? (
                              <div className="truncate" title={review.review_text}>
                                {review.review_text}
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                review.is_approved
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {review.is_approved ? 'Approved' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleModalOpen(review)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(review.id)}
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
                    {editingReview ? 'Edit Review' : 'Add Review'}
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

                    {/* User (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        User <span className="text-red-500">*</span>
                      </label>
                      <Select
                        value={formData.user_id}
                        onChange={(value) => setFormData({ ...formData, user_id: value || '' })}
                        options={users?.map(u => ({ 
                          value: u.id.toString(), 
                          label: `${u.name || `User ${u.id}`}${u.email ? ` (${u.email})` : ''}` 
                        })) || []}
                        placeholder="Select user"
                      />
                    </div>

                    {/* Rating (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rating <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={formData.rating}
                          onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) || 1 })}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        />
                        <div className="flex items-center gap-1">
                          {renderStars(formData.rating)}
                        </div>
                      </div>
                    </div>

                    {/* Review Text */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Review Text</label>
                      <textarea
                        value={formData.review_text}
                        onChange={(e) => setFormData({ ...formData, review_text: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="Enter review text..."
                      />
                    </div>

                    {/* Is Approved */}
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is_approved"
                        checked={formData.is_approved}
                        onChange={(e) => setFormData({ ...formData, is_approved: e.target.checked })}
                        className="h-4 w-4 text-pink focus:ring-pink border-gray-300 rounded"
                      />
                      <label htmlFor="is_approved" className="text-sm font-medium text-gray-700">
                        Approved
                      </label>
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
                      {editingReview ? 'Update' : 'Create'}
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
            title="Delete Review"
            message="Are you sure you want to delete this review? This action cannot be undone."
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
