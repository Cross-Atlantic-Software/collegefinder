'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllChapters,
  createChapter,
  updateChapter,
  deleteChapter,
  deleteAllChapters,
  Chapter,
} from '@/api';
import { getAllSubjectsPublic } from '@/api';
import { FiPlus, FiSearch, FiX, FiTrash2 } from 'react-icons/fi';
import { AdminTableActions } from '@/components/admin/AdminTableActions';
import { ConfirmationModal, useToast, Select, SelectOption } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

export default function ChaptersPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [allChapters, setAllChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    sub_id: '',
    name: '',
    status: true,
    description: '',
    sort_order: 0,
  });
  const [availableSubjects, setAvailableSubjects] = useState<SelectOption[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingChapter, setViewingChapter] = useState<Chapter | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const { canDelete } = useAdminPermissions();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    fetchChapters();
    fetchSubjects();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await getAllSubjectsPublic();
      if (response.success && response.data) {
        setAvailableSubjects(
          response.data.subjects.map((s) => ({ value: String(s.id), label: s.name }))
        );
      }
    } catch (err) {
      console.error('Error fetching subjects:', err);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setChapters(allChapters);
      return;
    }
    const q = searchQuery.toLowerCase();
    setChapters(allChapters.filter((c) => c.name.toLowerCase().includes(q)));
  }, [searchQuery, allChapters]);

  const fetchChapters = async () => {
    try {
      setIsLoading(true);
      const response = await getAllChapters();
      if (response.success && response.data) {
        setAllChapters(response.data.chapters);
        setChapters(response.data.chapters);
      } else {
        setError(response.message || 'Failed to fetch chapters');
      }
    } catch {
      setError('An error occurred while fetching chapters');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const nameTrim = formData.name.trim();
    if (!formData.sub_id) {
      showError('Subject is required');
      return;
    }
    if (!nameTrim) {
      showError('Chapter name is required');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        sub_id: parseInt(formData.sub_id, 10),
        name: nameTrim,
        status: formData.status,
        description: formData.description || undefined,
        sort_order: formData.sort_order,
      };
      const response = editingChapter
        ? await updateChapter(editingChapter.id, payload)
        : await createChapter(payload);
      if (response.success) {
        showSuccess(editingChapter ? 'Chapter updated' : 'Chapter created');
        fetchChapters();
        handleModalClose();
      } else {
        showError(response.message || 'Failed to save chapter');
      }
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Failed to save chapter');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ sub_id: '', name: '', status: true, description: '', sort_order: 0 });
    setError(null);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingChapter(null);
    resetForm();
  };

  const handleCreate = () => {
    setEditingChapter(null);
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setFormData({
      sub_id: String(chapter.sub_id),
      name: chapter.name,
      status: chapter.status,
      description: chapter.description || '',
      sort_order: chapter.sort_order,
    });
    setShowModal(true);
  };

  const handleView = (chapter: Chapter) => {
    setViewingChapter(chapter);
    setShowViewModal(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      const response = await deleteChapter(deletingId);
      if (response.success) {
        showSuccess('Chapter deleted');
        fetchChapters();
      } else {
        showError(response.message || 'Failed to delete chapter');
      }
    } catch {
      showError('Failed to delete chapter');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      const response = await deleteAllChapters();
      if (response.success) {
        showSuccess('All chapters deleted');
        fetchChapters();
      } else {
        showError(response.message || 'Failed to delete chapters');
      }
    } catch {
      showError('Failed to delete chapters');
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllConfirm(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#F6F8FA]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title="Chapters" />
        <main className="flex-1 overflow-auto p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search chapters..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
              />
            </div>
            <div className="flex gap-2">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteAllConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm border border-red-200 text-red-700 rounded-lg hover:bg-red-50"
                >
                  <FiTrash2 className="h-4 w-4" /> Delete all
                </button>
              )}
              <button
                type="button"
                onClick={handleCreate}
                className="flex items-center gap-1.5 px-3 py-2 text-sm bg-[#341050] text-white rounded-lg hover:bg-[#4a1868]"
              >
                <FiPlus className="h-4 w-4" /> Add chapter
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

          {isLoading ? (
            <p className="text-sm text-slate-500">Loading chapters...</p>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-[#F6F8FA] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">NAME</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">SUBJECT</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">STATUS</th>
                    <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {chapters.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-4 text-center text-sm text-slate-500">
                        No chapters found
                      </td>
                    </tr>
                  ) : (
                    chapters.map((chapter) => {
                      const subject = availableSubjects.find((s) => s.value === String(chapter.sub_id));
                      return (
                        <tr key={chapter.id} className="hover:bg-[#F6F8FA]">
                          <td className="px-4 py-2 text-sm font-medium text-slate-900">{chapter.name}</td>
                          <td className="px-4 py-2 text-sm text-slate-600">
                            {chapter.subject_name || subject?.label || `Subject ${chapter.sub_id}`}
                          </td>
                          <td className="px-4 py-2">
                            {chapter.status ? (
                              <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">Active</span>
                            ) : (
                              <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-800">Inactive</span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <AdminTableActions
                              onView={() => handleView(chapter)}
                              onEdit={() => handleEdit(chapter)}
                              onDelete={() => handleDeleteClick(chapter.id)}
                            />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">{editingChapter ? 'Edit Chapter' : 'Create Chapter'}</h2>
              <button type="button" onClick={handleModalClose} className="text-slate-500 hover:text-slate-800">
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Subject *</label>
                <Select
                  options={availableSubjects}
                  value={formData.sub_id}
                  onChange={(value) => setFormData({ ...formData, sub_id: value || '' })}
                  placeholder="Select subject"
                  isSearchable
                  isClearable={false}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="chapter-status"
                  checked={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                />
                <label htmlFor="chapter-status" className="text-sm text-slate-700">Active</label>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !formData.sub_id || !formData.name.trim()}
                className="w-full py-2 text-sm bg-[#341050] text-white rounded-lg hover:bg-[#4a1868] disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : editingChapter ? 'Update' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showViewModal && viewingChapter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-4">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">{viewingChapter.name}</h2>
              <button type="button" onClick={() => setShowViewModal(false)}><FiX /></button>
            </div>
            <p className="text-sm text-slate-600">
              Subject: {viewingChapter.subject_name || viewingChapter.sub_id}
            </p>
            <p className="text-sm text-slate-600 mt-1">Status: {viewingChapter.status ? 'Active' : 'Inactive'}</p>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Chapter"
        message="Delete this chapter? Topics under it will also be removed."
        isLoading={isDeleting}
      />

      <ConfirmationModal
        isOpen={showDeleteAllConfirm}
        onClose={() => setShowDeleteAllConfirm(false)}
        onConfirm={handleDeleteAll}
        title="Delete All Chapters"
        message="Delete every chapter? This cannot be undone."
        isLoading={isDeletingAll}
      />
    </div>
  );
}
