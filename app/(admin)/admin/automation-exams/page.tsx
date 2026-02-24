'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllAutomationExams,
  createAutomationExam,
  updateAutomationExam,
  deleteAutomationExam,
  AutomationExam,
  CreateAutomationExamData,
} from '@/api/admin/automation-exams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiEye, FiLink, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function AutomationExamsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [exams, setExams] = useState<AutomationExam[]>([]);
  const [allExams, setAllExams] = useState<AutomationExam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<AutomationExam | null>(null);
  const [viewingExam, setViewingExam] = useState<AutomationExam | null>(null);
  const [formData, setFormData] = useState<CreateAutomationExamData>({
    name: '',
    slug: '',
    url: '',
    is_active: true,
    field_mappings: {},
    agent_config: {},
    notify_on_complete: true,
    notify_on_failure: true,
    notification_emails: [],
  });
  const [fieldMappingsText, setFieldMappingsText] = useState('{}');
  const [agentConfigText, setAgentConfigText] = useState('{}');
  const [notificationEmailsText, setNotificationEmailsText] = useState('');
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

    fetchExams();
  }, [router]);

  useEffect(() => {
    if (allExams.length === 0) {
      setExams([]);
      return;
    }

    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setExams(allExams);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allExams.filter(exam =>
        exam.name.toLowerCase().includes(searchLower) ||
        exam.slug.toLowerCase().includes(searchLower) ||
        exam.url.toLowerCase().includes(searchLower)
      );
      setExams(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allExams]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const response = await getAllAutomationExams();
      if (response.success && response.data) {
        setAllExams(response.data);
        setExams(response.data);
      } else {
        setError(response.message || 'Failed to fetch exams');
      }
    } catch (err) {
      setError('An error occurred while fetching exams');
      console.error('Error fetching exams:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      url: '',
      is_active: true,
      field_mappings: {},
      agent_config: {},
      notify_on_complete: true,
      notify_on_failure: true,
      notification_emails: [],
    });
    setFieldMappingsText('{}');
    setAgentConfigText('{}');
    setNotificationEmailsText('');
    setEditingExam(null);
    setError(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (exam: AutomationExam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      slug: exam.slug,
      url: exam.url,
      is_active: exam.is_active,
      field_mappings: exam.field_mappings || {},
      agent_config: exam.agent_config || {},
      notify_on_complete: exam.notify_on_complete,
      notify_on_failure: exam.notify_on_failure,
      notification_emails: exam.notification_emails || [],
    });
    setFieldMappingsText(JSON.stringify(exam.field_mappings || {}, null, 2));
    setAgentConfigText(JSON.stringify(exam.agent_config || {}, null, 2));
    setNotificationEmailsText((exam.notification_emails || []).join(', '));
    setShowModal(true);
  };

  const handleView = (exam: AutomationExam) => {
    setViewingExam(exam);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Exam name is required');
      return;
    }

    if (!formData.slug.trim()) {
      setError('Slug is required');
      return;
    }

    if (!formData.url.trim()) {
      setError('URL is required');
      return;
    }

    // Parse JSON fields
    let fieldMappings = {};
    let agentConfig = {};
    let notificationEmails: string[] = [];

    try {
      if (fieldMappingsText.trim()) {
        fieldMappings = JSON.parse(fieldMappingsText);
      }
    } catch (err) {
      setError('Invalid JSON in Field Mappings');
      return;
    }

    try {
      if (agentConfigText.trim()) {
        agentConfig = JSON.parse(agentConfigText);
      }
    } catch (err) {
      setError('Invalid JSON in Agent Config');
      return;
    }

    if (notificationEmailsText.trim()) {
      notificationEmails = notificationEmailsText
        .split(',')
        .map(email => email.trim())
        .filter(email => email.length > 0);
    }

    try {
      setIsSubmitting(true);
      const examData: CreateAutomationExamData = {
        ...formData,
        field_mappings: fieldMappings,
        agent_config: agentConfig,
        notification_emails: notificationEmails,
      };

      let response;
      if (editingExam) {
        response = await updateAutomationExam(editingExam.id, examData);
      } else {
        response = await createAutomationExam(examData);
      }

      if (response.success) {
        showSuccess(editingExam ? 'Exam updated successfully' : 'Exam created successfully');
        setShowModal(false);
        resetForm();
        fetchExams();
      } else {
        const errorMsg = response.message || `Failed to ${editingExam ? 'update' : 'create'} exam`;
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = `An error occurred while ${editingExam ? 'updating' : 'creating'} exam`;
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving exam:', err);
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
      const response = await deleteAutomationExam(deletingId);
      if (response.success) {
        showSuccess('Exam deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchExams();
      } else {
        showError(response.message || 'Failed to delete exam');
      }
    } catch (err: any) {
      showError('An error occurred while deleting exam');
      console.error('Error deleting exam:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!editingExam) {
      setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          {/* Header */}
          <div className="mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Automation Exams</h1>
              <p className="text-gray-600">Manage exam configurations for automation workflows</p>
            </div>
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              New Exam
            </button>
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          )}

          {/* Exams Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                Loading exams...
              </div>
            ) : exams.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                No exams found. Create your first exam to get started.
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exams.map((exam) => (
                    <tr key={exam.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{exam.name}</div>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">{exam.slug}</code>
                      </td>
                      <td className="px-6 py-4">
                        <a
                          href={exam.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <FiLink className="w-3 h-3" />
                          {exam.url.length > 40 ? `${exam.url.substring(0, 40)}...` : exam.url}
                        </a>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            exam.is_active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {exam.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(exam.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleView(exam)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(exam)}
                            className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(exam.id)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Delete"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingExam ? 'Edit Exam' : 'Create New Exam'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                  pattern="[a-z0-9-]+"
                  title="Slug must contain only lowercase letters, numbers, and hyphens"
                />
                <p className="mt-1 text-xs text-gray-500">URL-friendly identifier (e.g., jee-main-2024)</p>
              </div>

              {/* URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registration URL <span className="text-red-500">*</span>
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                  Active
                </label>
              </div>

              {/* Field Mappings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Field Mappings (JSON)
                </label>
                <textarea
                  value={fieldMappingsText}
                  onChange={(e) => setFieldMappingsText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"fullName": {"type": "text", "required": true}, "phone": {"type": "phone"}}'
                />
                <p className="mt-1 text-xs text-gray-500">JSON object mapping user data fields to form configurations</p>
              </div>

              {/* Agent Config */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agent Config (JSON)
                </label>
                <textarea
                  value={agentConfigText}
                  onChange={(e) => setAgentConfigText(e.target.value)}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  placeholder='{"max_retries": 3, "screenshot_interval_ms": 1000, "captcha": {"auto_solve_enabled": false}}'
                />
                <p className="mt-1 text-xs text-gray-500">JSON object for LLM agent configuration</p>
              </div>

              {/* Notification Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_on_complete"
                    checked={formData.notify_on_complete}
                    onChange={(e) => setFormData({ ...formData, notify_on_complete: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notify_on_complete" className="text-sm font-medium text-gray-700">
                    Notify on Complete
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="notify_on_failure"
                    checked={formData.notify_on_failure}
                    onChange={(e) => setFormData({ ...formData, notify_on_failure: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="notify_on_failure" className="text-sm font-medium text-gray-700">
                    Notify on Failure
                  </label>
                </div>
              </div>

              {/* Notification Emails */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notification Emails (comma-separated)
                </label>
                <input
                  type="text"
                  value={notificationEmailsText}
                  onChange={(e) => setNotificationEmailsText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {isSubmitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Exam Details</h2>
              <button
                onClick={() => setViewingExam(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
                  <p className="text-gray-900">{viewingExam.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Slug</label>
                  <code className="text-sm text-gray-900 bg-gray-100 px-2 py-1 rounded">{viewingExam.slug}</code>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">URL</label>
                  <a
                    href={viewingExam.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {viewingExam.url}
                  </a>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      viewingExam.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {viewingExam.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-gray-900">
                    {new Date(viewingExam.created_at).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Field Mappings</label>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(viewingExam.field_mappings, null, 2)}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Agent Config</label>
                <pre className="bg-gray-50 p-3 rounded-lg text-xs overflow-x-auto">
                  {JSON.stringify(viewingExam.agent_config, null, 2)}
                </pre>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Notification Emails</label>
                <p className="text-gray-900">
                  {viewingExam.notification_emails && viewingExam.notification_emails.length > 0
                    ? viewingExam.notification_emails.join(', ')
                    : 'None'}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t">
                <button
                  onClick={() => {
                    setViewingExam(null);
                    handleEdit(viewingExam);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Exam
                </button>
                <button
                  onClick={() => setViewingExam(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
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
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDeleting={isDeleting}
      />
    </div>
  );
}
