'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { 
  getAllCollegeNews, 
  createCollegeNews, 
  updateCollegeNews, 
  deleteCollegeNews,
  CollegeNews 
} from '@/api/admin/college-news';
import { getAllColleges, College } from '@/api/admin/colleges';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiRss, FiExternalLink } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CollegeNewsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [news, setNews] = useState<CollegeNews[]>([]);
  const [allNews, setAllNews] = useState<CollegeNews[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState<CollegeNews | null>(null);
  const [formData, setFormData] = useState({
    college_id: '',
    title: '',
    teaser: '',
    url: '',
    source_name: '',
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
    if (allNews.length === 0) {
      setNews([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setNews(allNews);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allNews.filter(n =>
        n.college_name?.toLowerCase().includes(searchLower) ||
        n.title.toLowerCase().includes(searchLower) ||
        n.teaser.toLowerCase().includes(searchLower) ||
        (n.source_name && n.source_name.toLowerCase().includes(searchLower))
      );
      setNews(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allNews]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [newsResponse, collegesResponse] = await Promise.all([
        getAllCollegeNews(),
        getAllColleges()
      ]);
      
      if (newsResponse.success && newsResponse.data) {
        setAllNews(newsResponse.data.news);
        setNews(newsResponse.data.news);
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
      title: '',
      teaser: '',
      url: '',
      source_name: '',
    });
    setEditingNews(null);
    setError(null);
  };

  const handleModalOpen = (newsItem?: CollegeNews) => {
    if (newsItem) {
      setEditingNews(newsItem);
      setFormData({
        college_id: newsItem.college_id.toString(),
        title: newsItem.title,
        teaser: newsItem.teaser,
        url: newsItem.url,
        source_name: newsItem.source_name || '',
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

    if (!formData.college_id || !formData.title.trim() || !formData.teaser.trim() || !formData.url.trim()) {
      setError('College, Title, Teaser, and URL are required');
      return;
    }

    if (formData.teaser.length > 30) {
      setError('Teaser must be 30 characters or less');
      return;
    }

    try {
      const newsData: any = {
        college_id: parseInt(formData.college_id),
        title: formData.title.trim(),
        teaser: formData.teaser.trim(),
        url: formData.url.trim(),
        source_name: formData.source_name.trim() || null,
      };

      let response;
      if (editingNews) {
        response = await updateCollegeNews(editingNews.id, newsData);
      } else {
        response = await createCollegeNews(newsData);
      }

      if (response.success) {
        showSuccess(`News article ${editingNews ? 'updated' : 'created'} successfully`);
        handleModalClose();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingNews ? 'update' : 'create'} news article`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingNews ? 'updating' : 'creating'} news article`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving news article:', err);
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
      const response = await deleteCollegeNews(deletingId);
      if (response.success) {
        showSuccess('News article deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        showError(response.message || 'Failed to delete news article');
      }
    } catch (err: any) {
      showError(err.message || 'An error occurred while deleting news article');
      console.error('Error deleting news article:', err);
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
                <h1 className="text-2xl font-bold text-gray-900 mb-2">College News</h1>
                <p className="text-gray-600">Manage college news articles</p>
              </div>
              <button
                onClick={() => handleModalOpen()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
              >
                <FiPlus className="h-4 w-4" />
                Add News
              </button>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by college name, title, teaser, or source..."
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
                <p className="mt-2 text-gray-600">Loading news...</p>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <FiRss className="mx-auto text-gray-400" size={48} />
                <p className="mt-4 text-gray-600">No news articles found</p>
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
                          Title
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Teaser
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          URL
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Source
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
                      {news.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.college_name || `College ID: ${item.college_id}`}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {item.title}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {item.teaser}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-pink hover:underline flex items-center gap-1"
                            >
                              Open
                              <FiExternalLink size={14} />
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {item.source_name || <span className="text-gray-400">-</span>}
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
                    {editingNews ? 'Edit News Article' : 'Add News Article'}
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

                    {/* Title (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Title <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        required
                      />
                    </div>

                    {/* Teaser (Required, max 30 chars) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teaser <span className="text-red-500">*</span> (max 30 characters)
                      </label>
                      <input
                        type="text"
                        value={formData.teaser}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value.length <= 30) {
                            setFormData({ ...formData, teaser: value });
                          }
                        }}
                        maxLength={30}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        required
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        {formData.teaser.length}/30 characters
                      </p>
                    </div>

                    {/* URL (Required) */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="https://example.com/news-article"
                        required
                      />
                    </div>

                    {/* Source Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Source Name</label>
                      <input
                        type="text"
                        value={formData.source_name}
                        onChange={(e) => setFormData({ ...formData, source_name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                        placeholder="e.g., Times of India, Hindustan Times"
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
                      {editingNews ? 'Update' : 'Create'}
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
            title="Delete News Article"
            message="Are you sure you want to delete this news article? This action cannot be undone."
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
