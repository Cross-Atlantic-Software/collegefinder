'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import {
  getAllModules,
  createModule,
  updateModule,
  deleteModule,
  type Module,
} from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch, FiX } from 'react-icons/fi';
import { useToast } from '@/components/shared';
import { ConfirmationModal } from '@/components/shared';

export default function ModulesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentAdmin, setCurrentAdmin] = useState<{ type?: string } | null>(null);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) setCurrentAdmin(JSON.parse(adminUserStr));
    fetchModules();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setModules(allModules);
      return;
    }
    const q = searchQuery.toLowerCase();
    setModules(allModules.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)));
  }, [searchQuery, allModules]);

  const fetchModules = async () => {
    try {
      setIsLoading(true);
      const res = await getAllModules();
      if (res.success && res.data?.modules) {
        setAllModules(res.data.modules);
        setModules(res.data.modules);
      } else {
        setError(res.message || 'Failed to fetch modules');
      }
    } catch (err) {
      setError('Failed to fetch modules');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', code: '' });
    setEditingModule(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showError('Name is required');
      return;
    }
    try {
      setIsSaving(true);
      if (editingModule) {
        const res = await updateModule(editingModule.id, {
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
        });
        if (res.success) {
          showSuccess('Module updated successfully');
          setShowModal(false);
          resetForm();
          fetchModules();
        } else {
          showError(res.message || 'Failed to update');
        }
      } else {
        const res = await createModule({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
        });
        if (res.success) {
          showSuccess('Module created successfully');
          setShowModal(false);
          resetForm();
          fetchModules();
        } else {
          showError(res.message || 'Failed to create');
        }
      }
    } catch (err) {
      showError('An error occurred');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (m: Module) => {
    setEditingModule(m);
    setFormData({ name: m.name, code: m.code });
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
      const res = await deleteModule(deletingId);
      if (res.success) {
        showSuccess('Module deleted');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchModules();
      } else {
        showError(res.message || 'Failed to delete');
      }
    } catch (err) {
      showError('Failed to delete');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSuperAdmin = currentAdmin?.type === 'super_admin';

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Super admin access required to manage modules.
            </div>
          </main>
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Modules</h1>
            <p className="text-sm text-gray-600">Manage admin panel modules for role-based access.</p>
          </div>
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="relative">
              <FiSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or code"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64"
              />
            </div>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90"
            >
              <FiPlus className="h-4 w-4" />
              Add Module
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">NAME</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">CODE</th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {modules.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">
                          No modules found
                        </td>
                      </tr>
                    ) : (
                      modules.map((m) => (
                        <tr key={m.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{m.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{m.code}</td>
                          <td className="px-4 py-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditClick(m)}
                                className="p-2 text-blue-600 hover:text-blue-800"
                                title="Edit"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(m.id)}
                                className="p-2 text-red-600 hover:text-red-800"
                                title="Delete"
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
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between rounded-t-xl">
              <h2 className="text-lg font-bold">{editingModule ? 'Edit Module' : 'Create Module'}</h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-white hover:text-gray-200"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code (optional, auto from name)</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. career_goals"
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingModule ? 'Update' : 'Create'}
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
        title="Delete Module"
        message="Are you sure you want to delete this module? This may affect admin user access."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
