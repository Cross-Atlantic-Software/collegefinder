'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllEmailTemplates, deleteEmailTemplate, EmailTemplate } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import EmailTemplateModal from '@/components/admin/modals/EmailTemplateModal';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function EmailTemplatesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [allTemplates, setAllTemplates] = useState<EmailTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchTemplates();
  }, [router]);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await getAllEmailTemplates();
      if (response.success && response.data) {
        setAllTemplates(response.data.templates);
        setTemplates(response.data.templates);
      } else {
        setError(response.message || 'Failed to fetch email templates');
      }
    } catch (err) {
      setError('An error occurred while fetching email templates');
      console.error('Error fetching templates:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search handler
  useEffect(() => {
    if (allTemplates.length === 0) {
      setTemplates([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setTemplates(allTemplates);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allTemplates.filter(template =>
        template.type.toLowerCase().includes(searchLower) ||
        template.subject.toLowerCase().includes(searchLower)
      );
      setTemplates(filtered);
    }, 300); // 300ms debounce for smooth search

    return () => clearTimeout(timer);
  }, [searchQuery, allTemplates]);

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteEmailTemplate(deletingId);
      if (response.success) {
        showSuccess('Email template deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchTemplates();
      } else {
        const errorMsg = response.message || 'Failed to delete email template';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting email template';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting template:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowModal(true);
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingTemplate(null);
    fetchTemplates();
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Email Template Manager</h1>
            <p className="text-sm text-gray-600">Manage email templates for different types of notifications.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All templates</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allTemplates.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by type or subject"
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
              Add Template
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Templates Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading email templates...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        TYPE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        SUBJECT
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
                    {templates.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          {templates.length < allTemplates.length ? 'No templates found matching your search' : 'No email templates found'}
                        </td>
                      </tr>
                    ) : (
                      templates.map((template) => (
                        <tr key={template.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{template.type}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-600">{template.subject}</td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(template.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(template.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(template)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(template.id)}
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

      {/* Email Template Modal */}
      {showModal && (
        <EmailTemplateModal
          template={editingTemplate}
          onClose={handleModalClose}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setDeletingId(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Email Template"
        message="Are you sure you want to delete this email template? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}

