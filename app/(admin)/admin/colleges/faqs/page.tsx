'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllCollegeFAQs, createCollegeFAQ, updateCollegeFAQ, deleteCollegeFAQ, CollegeFAQ } from '@/api/admin/college-faqs';
import { getAllColleges, College } from '@/api/admin/colleges';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { ConfirmationModal, useToast, Select } from '@/components/shared';

export default function CollegeFAQsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [faqs, setFaqs] = useState<CollegeFAQ[]>([]);
  const [allFaqs, setAllFaqs] = useState<CollegeFAQ[]>([]);
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingFAQ, setEditingFAQ] = useState<CollegeFAQ | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({ college_id: '', question: '', answer: '' });

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
    if (allFaqs.length === 0) {
      setFaqs([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setFaqs(allFaqs);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allFaqs.filter(f =>
        f.question.toLowerCase().includes(searchLower) ||
        f.answer.toLowerCase().includes(searchLower) ||
        f.college_name?.toLowerCase().includes(searchLower)
      );
      setFaqs(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allFaqs]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [faqsRes, collegesRes] = await Promise.all([
        getAllCollegeFAQs(),
        getAllColleges(),
      ]);

      if (faqsRes.success && faqsRes.data) {
        setAllFaqs(faqsRes.data.faqs);
        setFaqs(faqsRes.data.faqs);
      }
      if (collegesRes.success && collegesRes.data) {
        setColleges(collegesRes.data.colleges);
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

    if (!formData.college_id || !formData.question.trim() || !formData.answer.trim()) {
      setError('College, Question, and Answer are required');
      return;
    }

    try {
      setIsSubmitting(true);
      const faqData = {
        college_id: parseInt(formData.college_id),
        question: formData.question,
        answer: formData.answer,
      };

      let response;
      if (editingFAQ) {
        response = await updateCollegeFAQ(editingFAQ.id, faqData);
      } else {
        response = await createCollegeFAQ(faqData);
      }

      if (response.success) {
        showSuccess(`FAQ ${editingFAQ ? 'updated' : 'created'} successfully`);
        setShowModal(false);
        resetForm();
        fetchData();
      } else {
        const errorMsg = response.message || `Failed to ${editingFAQ ? 'update' : 'create'} FAQ`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingFAQ ? 'updating' : 'creating'} FAQ`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving FAQ:', err);
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
      const response = await deleteCollegeFAQ(deletingId);
      if (response.success) {
        showSuccess('FAQ deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchData();
      } else {
        const errorMsg = response.message || 'Failed to delete FAQ';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err: any) {
      const errorMsg = 'An error occurred while deleting FAQ';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting FAQ:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (faq: CollegeFAQ) => {
    setEditingFAQ(faq);
    setFormData({
      college_id: faq.college_id.toString(),
      question: faq.question,
      answer: faq.answer,
    });
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingFAQ(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ college_id: '', question: '', answer: '' });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingFAQ(null);
    resetForm();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">College FAQs Manager</h1>
            <p className="text-sm text-gray-600">Manage college FAQs.</p>
          </div>

          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All FAQs</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allFaqs.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by question, answer, college..."
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
              Add FAQ
            </button>
          </div>

          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading FAQs...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">COLLEGE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">QUESTION</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ANSWER</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {faqs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-4 py-4 text-center text-sm text-gray-500">
                          {faqs.length < allFaqs.length ? 'No FAQs found matching your search' : 'No FAQs found'}
                        </td>
                      </tr>
                    ) : (
                      faqs.map((faq) => (
                        <tr key={faq.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{faq.college_name || '-'}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700 line-clamp-2 max-w-xs">{faq.question}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-700 line-clamp-2 max-w-xs">{faq.answer}</span>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(faq)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(faq.id)}
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingFAQ ? 'Edit FAQ' : 'Create FAQ'}
              </h2>
              <button
                onClick={handleModalClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.question}
                    onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Answer <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.answer}
                    onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
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
                  {isSubmitting ? 'Saving...' : editingFAQ ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete FAQ"
        message="Are you sure you want to delete this FAQ? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        confirmButtonStyle="danger"
      />
    </div>
  );
}

