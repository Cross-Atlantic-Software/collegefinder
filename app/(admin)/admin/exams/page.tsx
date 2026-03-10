'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllExamsAdmin, createExam, updateExam, deleteExam, getExamPrompt, updateExamPrompt, type Exam } from '@/api/admin/exams';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX, FiFileText } from 'react-icons/fi';
import { ConfirmationModal, useToast } from '@/components/shared';

export default function ExamsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [allExams, setAllExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [promptExam, setPromptExam] = useState<Exam | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [promptLoading, setPromptLoading] = useState(false);
  const [promptSaving, setPromptSaving] = useState(false);
  const [hasCustomPrompt, setHasCustomPrompt] = useState(false);
  // Section: "Exams" table vs "Generation prompts" for all exams
  const [activeSection, setActiveSection] = useState<'exams' | 'prompts'>('exams');
  const [promptsByExamId, setPromptsByExamId] = useState<Record<number, { prompt: string; hasCustomPrompt: boolean }>>({});
  const [promptsSectionLoading, setPromptsSectionLoading] = useState(false);
  const [savingPromptExamId, setSavingPromptExamId] = useState<number | null>(null);

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
        exam.code.toLowerCase().includes(searchLower) ||
        (exam.description && exam.description.toLowerCase().includes(searchLower))
      );
      setExams(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allExams]);

  // Load all exam prompts when switching to the "Generation prompts" section
  useEffect(() => {
    if (activeSection !== 'prompts' || allExams.length === 0) return;
    let cancelled = false;
    const loadAllPrompts = async () => {
      setPromptsSectionLoading(true);
      const next: Record<number, { prompt: string; hasCustomPrompt: boolean }> = {};
      await Promise.all(
        allExams.map(async (exam) => {
          try {
            const res = await getExamPrompt(exam.id);
            if (!cancelled && res.success && res.data) {
              next[exam.id] = {
                prompt: res.data.prompt || '',
                hasCustomPrompt: !!res.data.hasCustomPrompt,
              };
            }
          } catch {
            if (!cancelled) next[exam.id] = { prompt: '', hasCustomPrompt: false };
          }
        })
      );
      if (!cancelled) setPromptsByExamId((prev) => ({ ...prev, ...next }));
      setPromptsSectionLoading(false);
    };
    loadAllPrompts();
    return () => { cancelled = true; };
  }, [activeSection, allExams]);

  const fetchExams = async () => {
    try {
      setIsLoading(true);
      const response = await getAllExamsAdmin();
      if (response.success && response.data) {
        setAllExams(response.data.exams);
        setExams(response.data.exams);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (editingExam) {
        const response = await updateExam(editingExam.id, formData);
        if (response.success) {
          showSuccess('Exam updated successfully');
          fetchExams();
          handleModalClose();
        } else {
          setError(response.message || 'Failed to update exam');
          showError(response.message || 'Failed to update exam');
        }
      } else {
        const response = await createExam(formData);
        if (response.success) {
          showSuccess('Exam created successfully');
          fetchExams();
          handleModalClose();
        } else {
          setError(response.message || 'Failed to create exam');
          showError(response.message || 'Failed to create exam');
        }
      }
    } catch (err) {
      const errorMsg = 'An error occurred while saving exam';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error saving exam:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (exam: Exam) => {
    setEditingExam(exam);
    setFormData({
      name: exam.name,
      code: exam.code,
      description: exam.description || '',
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;

    try {
      setIsDeleting(true);
      const response = await deleteExam(deletingId);
      if (response.success) {
        showSuccess('Exam deleted successfully');
        fetchExams();
      } else {
        showError(response.message || 'Failed to delete exam');
      }
    } catch (err) {
      showError('An error occurred while deleting exam');
      console.error('Error deleting exam:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    resetForm();
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({ name: '', code: '', description: '' });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingExam(null);
    resetForm();
  };

  const handleOpenPrompt = async (exam: Exam) => {
    setPromptExam(exam);
    setShowPromptModal(true);
    setPromptValue('');
    setHasCustomPrompt(false);
    setPromptLoading(true);
    try {
      const res = await getExamPrompt(exam.id);
      if (res.success && res.data) {
        setPromptValue(res.data.prompt || '');
        setHasCustomPrompt(!!res.data.hasCustomPrompt);
      }
    } catch {
      showError('Failed to load prompt');
    } finally {
      setPromptLoading(false);
    }
  };

  const handleSavePrompt = async () => {
    if (!promptExam) return;
    setPromptSaving(true);
    try {
      const res = await updateExamPrompt(promptExam.id, promptValue);
      if (res.success) {
        showSuccess('Prompt updated. It will be used for mock question generation for this exam.');
        setHasCustomPrompt(!!(promptValue && promptValue.trim()));
      } else {
        showError(res.message || 'Failed to save prompt');
      }
    } catch {
      showError('Failed to save prompt');
    } finally {
      setPromptSaving(false);
    }
  };

  const handleClosePromptModal = () => {
    setShowPromptModal(false);
    setPromptExam(null);
    setPromptValue('');
  };

  const setPromptForExam = (examId: number, prompt: string) => {
    setPromptsByExamId((prev) => ({
      ...prev,
      [examId]: {
        ...prev[examId],
        prompt,
        hasCustomPrompt: prev[examId]?.hasCustomPrompt ?? false,
      },
    }));
  };

  const handleSavePromptInSection = async (exam: Exam) => {
    const current = promptsByExamId[exam.id];
    if (current === undefined) return;
    setSavingPromptExamId(exam.id);
    try {
      const res = await updateExamPrompt(exam.id, current.prompt);
      if (res.success) {
        showSuccess(`Prompt saved for ${exam.name}`);
        setPromptsByExamId((prev) => ({
          ...prev,
          [exam.id]: { ...prev[exam.id], prompt: current.prompt, hasCustomPrompt: !!(current.prompt && current.prompt.trim()) },
        }));
      } else {
        showError(res.message || 'Failed to save prompt');
      }
    } catch {
      showError('Failed to save prompt');
    } finally {
      setSavingPromptExamId(null);
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Exams Manager</h1>
            <p className="text-sm text-gray-600">Manage exam options that users can select.</p>
          </div>

          {/* Section tabs: Exams | Generation prompts */}
          <div className="mb-4 flex gap-1 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveSection('exams')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === 'exams'
                  ? 'bg-white border border-gray-200 border-b-0 -mb-px text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Exams
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('prompts')}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeSection === 'prompts'
                  ? 'bg-white border border-gray-200 border-b-0 -mb-px text-gray-900'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Generation prompts
            </button>
          </div>

          {/* Controls (only for Exams section) */}
          {activeSection === 'exams' && (
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All exams</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allExams.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, code, or description"
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
              Add Exam
            </button>
          </div>
          )}

          {/* Error Message (Exams section) */}
          {activeSection === 'exams' && error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Exams Table */}
          {activeSection === 'exams' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading exams...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        NAME
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        CODE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        CREATED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        LAST UPDATED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        PROMPT
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                          {exams.length < allExams.length ? 'No exams found matching your search' : 'No exams found'}
                        </td>
                      </tr>
                    ) : (
                      exams.map((exam) => (
                        <tr key={exam.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2">
                            <span className="text-sm font-medium text-gray-900">{exam.name}</span>
                          </td>
                          <td className="px-4 py-2">
                            <span className="text-sm text-gray-600 font-mono">{exam.code}</span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(exam.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-600">
                            {new Date(exam.updated_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => handleOpenPrompt(exam)}
                              className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                              title="Edit generation prompt for mock questions"
                            >
                              <FiFileText className="h-3.5 w-3.5" />
                              Prompt
                            </button>
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEdit(exam)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(exam.id)}
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
          )}

          {/* Generation prompts section: all exams from DB with prompt edit */}
          {activeSection === 'prompts' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Set an exam-specific prompt for mock question generation. When set, it is used instead of the generic prompt. Placeholders: {'{{exam_name}}'}, {'{{subject}}'}, {'{{difficulty}}'}, {'{{topic}}'}, {'{{section_name}}'}, {'{{section_type}}'}, {'{{question_type}}'}
              </p>
              {promptsSectionLoading ? (
                <div className="py-8 text-center text-gray-500">Loading prompts for all exams...</div>
              ) : (
                <div className="space-y-4">
                  {allExams.map((exam) => {
                    const data = promptsByExamId[exam.id];
                    const promptText = data?.prompt ?? '';
                    const isSaving = savingPromptExamId === exam.id;
                    return (
                      <div
                        key={exam.id}
                        className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                      >
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900">{exam.name}</span>
                            <span className="ml-2 text-sm text-gray-500 font-mono">{exam.code}</span>
                            {data?.hasCustomPrompt && (
                              <span className="ml-2 text-xs text-green-600 font-medium">Custom prompt set</span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSavePromptInSection(exam)}
                            disabled={isSaving || data === undefined}
                            className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSaving ? 'Saving...' : 'Save prompt'}
                          </button>
                        </div>
                        <div className="p-4">
                          <textarea
                            value={data === undefined ? '' : promptText}
                            onChange={(e) => setPromptForExam(exam.id, e.target.value)}
                            placeholder="Leave empty to use the generic prompt, or enter exam-specific instructions..."
                            rows={8}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-y font-mono"
                          />
                        </div>
                      </div>
                    );
                  })}
                  {allExams.length === 0 && (
                    <p className="text-sm text-gray-500 py-4">No exams in the database. Add exams in the Exams tab first.</p>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Exam Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editingExam ? 'Edit Exam' : 'Create Exam'}
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
                    Exam Name <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="e.g., JEE Main, NEET"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Code <span className="text-pink">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s+/g, '_') })}
                    required
                    placeholder="e.g., JEE_MAIN, NEET"
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none font-mono"
                  />
                  <p className="mt-1 text-xs text-gray-500">Code will be automatically converted to uppercase with underscores</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter exam description..."
                    rows={3}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none"
                  />
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
                disabled={isSaving || !formData.name || !formData.code}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving...' : editingExam ? 'Update' : 'Create'}
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
        title="Delete Exam"
        message="Are you sure you want to delete this exam? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />

      {/* Exam generation prompt modal */}
      {showPromptModal && promptExam && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Generation prompt — {promptExam.name}</h2>
              <button
                onClick={handleClosePromptModal}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 flex-1 overflow-auto">
              <p className="text-sm text-gray-600 mb-2">
                When set, this prompt is used for mock question generation instead of the generic one. Leave empty to use the generic prompt.
              </p>
              <p className="text-xs text-gray-500 mb-2">
                Placeholders: {'{{exam_name}}'}, {'{{subject}}'}, {'{{difficulty}}'}, {'{{topic}}'}, {'{{section_name}}'}, {'{{section_type}}'}, {'{{question_type}}'}
              </p>
              {promptLoading ? (
                <div className="py-8 text-center text-gray-500">Loading...</div>
              ) : (
                <textarea
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  placeholder="Enter exam-specific instructions for question generation..."
                  rows={14}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none resize-none font-mono"
                />
              )}
              {hasCustomPrompt && !promptValue.trim() && (
                <p className="mt-2 text-xs text-amber-600">Clearing and saving will switch this exam back to the generic prompt.</p>
              )}
            </div>
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClosePromptModal}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSavePrompt}
                disabled={promptSaving || promptLoading}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {promptSaving ? 'Saving...' : 'Save prompt'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

