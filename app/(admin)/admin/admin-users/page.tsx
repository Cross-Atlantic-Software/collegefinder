'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAllModules, AdminUser, type Module } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiShield, FiUser, FiSearch, FiRefreshCw, FiEye, FiEyeOff, FiSlash, FiCheckCircle } from 'react-icons/fi';
import { useToast } from '@/components/shared';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import { PasswordStrengthIndicator } from '@/components/admin/PasswordStrengthIndicator';
import { isPasswordStrong, generateStrongPassword } from '@/lib/passwordStrength';
import { ConfirmationModal, Dropdown, MultiSelect } from '@/components/shared';

export default function AdminUsersPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const { isSuperAdmin, admin: currentAdmin } = useAdminPermissions();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [modules, setModules] = useState<Module[]>([]);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);

  // Form state (type includes counsellor to match API)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    type: 'data_entry' as 'data_entry' | 'admin' | 'super_admin' | 'counsellor',
    module_ids: [] as number[],
  });

  // Edit form state (type includes counsellor to match AdminUser from API)
  const [editFormData, setEditFormData] = useState({
    email: '',
    password: '',
    type: 'data_entry' as 'data_entry' | 'admin' | 'super_admin' | 'counsellor',
    is_active: true,
    module_ids: [] as number[],
  });

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    fetchAdmins();
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchModules = async () => {
    try {
      const res = await getAllModules();
      if (res.success && res.data?.modules) {
        setModules(res.data.modules.filter((m) => m.code !== 'users'));
      }
    } catch (_) {}
  };

  // Debounced search and status filter
  useEffect(() => {
    if (allAdmins.length === 0) {
      setAdmins([]);
      return;
    }

    const timer = setTimeout(() => {
      let filtered = allAdmins;
      if (statusFilter === 'active') filtered = filtered.filter((a) => a.is_active);
      else if (statusFilter === 'disabled') filtered = filtered.filter((a) => !a.is_active);
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        filtered = filtered.filter((a) => a.email.toLowerCase().includes(searchLower));
      }
      setAdmins(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter, allAdmins]);

  const fetchAdmins = async () => {
    try {
      setIsLoading(true);
      const response = await getAllAdmins();
      if (response.success && response.data) {
        setAllAdmins(response.data.admins);
        setAdmins(response.data.admins);
      } else {
        setError(response.message || 'Failed to fetch admin users');
      }
    } catch (err) {
      setError('An error occurred while fetching admin users');
      console.error('Error fetching admins:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordStrong(formData.password)) {
      showError('Password does not meet requirements. Please ensure it has uppercase, lowercase, number, and special character.');
      return;
    }
    try {
      const response = await createAdmin(
        formData.email,
        formData.password,
        formData.type,
        formData.module_ids
      );
      if (response.success) {
        showSuccess('Admin user created successfully');
        setShowCreateModal(false);
        setFormData({ email: '', password: '', type: 'data_entry', module_ids: [] });
        setShowCreatePassword(false);
        fetchAdmins();
      } else {
        const errorMsg = response.message || 'Failed to create admin user';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while creating admin user';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error creating admin:', err);
    }
  };

  const handleUpdate = async (id: number, field: 'type' | 'is_active', value: any) => {
    try {
      const response = await updateAdmin(id, { [field]: value });
      if (response.success) {
        showSuccess('Admin user updated successfully');
        setEditingId(null);
        fetchAdmins();
      } else {
        const errorMsg = response.message || 'Failed to update admin user';
        setError(errorMsg);
        showError(errorMsg);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while updating admin user';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error updating admin:', err);
    }
  };

  const typeLabel = (t: string) => {
    if (t === 'super_admin') return 'Super Admin';
    if (t === 'admin') return 'Admin';
    if (t === 'counsellor') return 'Counsellor';
    return 'Data Entry';
  };

  const handleEditClick = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setEditFormData({
      email: admin.email,
      password: '',
      type: admin.type,
      is_active: admin.is_active,
      module_ids: admin.module_ids ?? [],
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin) return;

    if (editFormData.password.trim() !== '' && !isPasswordStrong(editFormData.password)) {
      showError('Password does not meet requirements. Please ensure it has uppercase, lowercase, number, and special character.');
      return;
    }

    try {
      setIsUpdating(true);
      const updateData: {
        email?: string;
        password?: string;
        type?: 'data_entry' | 'admin' | 'super_admin' | 'counsellor';
        is_active?: boolean;
        module_ids?: number[];
      } = {};
      if (editFormData.email !== editingAdmin.email) updateData.email = editFormData.email;
      if (editFormData.password.trim() !== '') updateData.password = editFormData.password;
      if (editingAdmin.type !== 'super_admin') {
        if (editFormData.type !== editingAdmin.type) updateData.type = editFormData.type;
        if (editFormData.is_active !== editingAdmin.is_active) updateData.is_active = editFormData.is_active;
        const prevIds = (editingAdmin.module_ids ?? []).slice().sort();
        const nextIds = editFormData.module_ids.slice().sort();
        if (prevIds.length !== nextIds.length || prevIds.some((id, i) => id !== nextIds[i])) {
          updateData.module_ids = editFormData.module_ids;
        }
      }
      if (Object.keys(updateData).length === 0) {
        showError('No changes to save');
        setIsUpdating(false);
        return;
      }
      const response = await updateAdmin(editingAdmin.id, updateData);
      if (response.success) {
        showSuccess('Admin user updated successfully');
        setShowEditModal(false);
        setEditingAdmin(null);
        setEditFormData({ email: '', password: '', type: 'data_entry', is_active: true, module_ids: [] });
        setShowEditPassword(false);
        fetchAdmins();
      } else {
        showError(response.message || 'Failed to update admin user');
      }
    } catch (err) {
      showError('An error occurred while updating admin user');
      console.error(err);
    } finally {
      setIsUpdating(false);
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
      const response = await deleteAdmin(deletingId);
      if (response.success) {
        showSuccess('Admin user deleted successfully');
        setShowDeleteConfirm(false);
        setDeletingId(null);
        fetchAdmins();
      } else {
        const errorMsg = response.message || 'Failed to delete admin user';
        setError(errorMsg);
        showError(errorMsg);
        setShowDeleteConfirm(false);
        setDeletingId(null);
      }
    } catch (err) {
      const errorMsg = 'An error occurred while deleting admin user';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error deleting admin:', err);
      setShowDeleteConfirm(false);
      setDeletingId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.replace('/admin/login')}
            className="text-[#341050] hover:underline"
          >
            Go to login
          </button>
        </div>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#F6F8FA] flex">
        <AdminSidebar />
        <div className="flex-1 flex flex-col">
          <AdminHeader />
          <main className="flex-1 p-6">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              Access denied. Super admin access required.
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Admin Users</h1>
            <p className="text-sm text-slate-600">Manage admin users and their access levels.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex min-w-[240px] rounded-lg border border-slate-300 overflow-hidden">
                {(['all', 'active', 'disabled'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                    className={`flex-1 min-w-[72px] px-4 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
                      statusFilter === f
                        ? 'bg-brand-ink text-white'
                        : 'bg-white text-slate-700 hover:bg-[#F6F8FA]'
                    }`}
                  >
                    {f === 'all' ? 'All' : f === 'active' ? 'Active' : 'Disabled'}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-500">
                {admins.length} of {allAdmins.length}
              </span>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search admins by email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              Add Admin
            </button>
          </div>

          {/* Admins Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-slate-500">Loading admin users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#F6F8FA] border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                        EMAIL
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                        TYPE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                        STATUS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                        DATE ADDED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">
                          No admin users found
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => {
                        const isEditing = editingId === admin.id;
                        const isSuperAdminType = admin.type === 'super_admin';
                        const isCurrentUser = admin.id === currentAdmin?.id;

                        return (
                          <tr key={admin.id} className="hover:bg-[#F6F8FA] transition-colors">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-highlight-100 flex items-center justify-center text-[#341050] text-sm font-semibold">
                                  {admin.email.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-900">{admin.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {isEditing && !isSuperAdminType ? (
                                <Dropdown
                                  value={admin.type}
                                  onChange={(v) => handleUpdate(admin.id, 'type', v)}
                                  options={[
                                    { value: 'data_entry', label: 'Data Entry' },
                                    { value: 'admin', label: 'Admin' },
                                    { value: 'counsellor', label: 'Counsellor' },
                                  ]}
                                  size="sm"
                                />
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isSuperAdminType
                                      ? 'bg-purple-100 text-purple-800'
                                      : admin.type === 'admin'
                                        ? 'bg-blue-100 text-blue-800'
                                        : admin.type === 'counsellor'
                                          ? 'bg-teal-100 text-teal-800'
                                          : 'bg-slate-100 text-slate-800'
                                  }`}
                                >
                                  {isSuperAdminType ? (
                                    <FiShield className="h-3 w-3" />
                                  ) : (
                                    <FiUser className="h-3 w-3" />
                                  )}
                                  {typeLabel(admin.type)}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  admin.is_active
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {admin.is_active ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-xs text-slate-600">
                              {new Date(admin.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })}
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                                    title="Cancel editing"
                                  >
                                    <FiX className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <>
                                    {isSuperAdminType ? (
                                      <>
                                        <button
                                          disabled
                                          className="p-2 text-slate-300 cursor-not-allowed"
                                          title="Super admin cannot be edited"
                                        >
                                          <FiEdit2 className="h-4 w-4" />
                                        </button>
                                        {!isCurrentUser && (
                                          admin.is_active ? (
                                            <button
                                              onClick={() => handleUpdate(admin.id, 'is_active', false)}
                                              disabled={isUpdating}
                                              className="p-2 text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50"
                                              title="Disable access"
                                            >
                                              <FiSlash className="h-4 w-4" strokeWidth={2.5} />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleUpdate(admin.id, 'is_active', true)}
                                              disabled={isUpdating}
                                              className="p-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                              title="Enable access"
                                            >
                                              <FiCheckCircle className="h-4 w-4" strokeWidth={2} />
                                            </button>
                                          )
                                        )}
                                        <button
                                          disabled
                                          className="p-2 text-slate-300 cursor-not-allowed"
                                          title="Super admin cannot be deleted"
                                        >
                                          <FiTrash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleEditClick(admin)}
                                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                          title="Edit admin"
                                        >
                                          <FiEdit2 className="h-4 w-4" />
                                        </button>
                                        {!isCurrentUser && (
                                          admin.is_active ? (
                                            <button
                                              onClick={() => handleUpdate(admin.id, 'is_active', false)}
                                              disabled={isUpdating}
                                              className="p-2 text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-50"
                                              title="Disable access"
                                            >
                                              <FiSlash className="h-4 w-4" strokeWidth={2.5} />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleUpdate(admin.id, 'is_active', true)}
                                              disabled={isUpdating}
                                              className="p-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                              title="Enable access"
                                            >
                                              <FiCheckCircle className="h-4 w-4" strokeWidth={2} />
                                            </button>
                                          )
                                        )}
                                        {isCurrentUser ? (
                                          <button
                                            disabled
                                            className="p-2 text-slate-300 cursor-not-allowed"
                                            title="You cannot delete your own account"
                                          >
                                            <FiTrash2 className="h-4 w-4" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleDeleteClick(admin.id)}
                                            className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                            title="Delete admin"
                                          >
                                            <FiTrash2 className="h-4 w-4" />
                                          </button>
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create Admin User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ email: '', password: '', type: 'data_entry', module_ids: [] });
                  setShowCreatePassword(false);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email <span className="text-[#341050]">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-[#341050]">*</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                        placeholder="Min 8 chars, upper, lower, number, special char"
                        className="w-full px-3 py-1.5 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword((p) => !p)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        title={showCreatePassword ? 'Hide password' : 'Show password'}
                      >
                        {showCreatePassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = generateStrongPassword();
                        setFormData({ ...formData, password: suggested });
                        showSuccess('Strong password generated');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] transition-colors whitespace-nowrap"
                      title="Generate a strong password"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Suggest
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={formData.password} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                  <Dropdown
                    value={formData.type}
                    onChange={(v) => setFormData({ ...formData, type: v })}
                    options={[
                      { value: 'data_entry', label: 'Data Entry' },
                      { value: 'admin', label: 'Admin' },
                      { value: 'counsellor', label: 'Counsellor' },
                      { value: 'super_admin', label: 'Super Admin' },
                    ]}
                    className="w-full"
                  />
                </div>
                {(formData.type === 'data_entry' || formData.type === 'admin' || formData.type === 'counsellor') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Modules (access)</label>
                    <MultiSelect
                      options={modules.map((m) => ({ value: m.id.toString(), label: m.name }))}
                      value={formData.module_ids.map((id) => id.toString())}
                      onChange={(vals) => setFormData({ ...formData, module_ids: vals.map(Number) })}
                      placeholder="Select modules..."
                      isSearchable={true}
                    />
                  </div>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ email: '', password: '', type: 'data_entry', module_ids: [] });
                  setShowCreatePassword(false);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditModal && editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Admin User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAdmin(null);
                  setEditFormData({ email: '', password: '', type: 'data_entry', is_active: true, module_ids: [] });
                  setShowEditPassword(false);
                }}
                className="text-slate-500 hover:text-slate-800 transition-colors"
                disabled={isUpdating}
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email <span className="text-[#341050]">*</span>
                  </label>
                  <input
                    type="email"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Password <span className="text-slate-500 text-xs">(leave empty to keep current)</span>
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editFormData.password}
                        onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                        minLength={8}
                        placeholder="Enter new password (min 8 chars, uppercase, lowercase, number, special char)"
                        className="w-full px-3 py-1.5 pr-10 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none"
                        disabled={isUpdating}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword((p) => !p)}
                        disabled={isUpdating}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={showEditPassword ? 'Hide password' : 'Show password'}
                      >
                        {showEditPassword ? <FiEyeOff className="h-4 w-4" /> : <FiEye className="h-4 w-4" />}
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const suggested = generateStrongPassword();
                        setEditFormData({ ...editFormData, password: suggested });
                        showSuccess('Strong password generated');
                      }}
                      disabled={isUpdating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate a strong password"
                    >
                      <FiRefreshCw className="h-4 w-4" />
                      Suggest
                    </button>
                  </div>
                  <PasswordStrengthIndicator password={editFormData.password} />
                </div>
                {editingAdmin.type !== 'super_admin' && (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Type</label>
                      <Dropdown
                        value={editFormData.type}
                        onChange={(v) => setEditFormData({ ...editFormData, type: v })}
                        options={[
                          { value: 'data_entry', label: 'Data Entry' },
                          { value: 'admin', label: 'Admin' },
                          { value: 'counsellor', label: 'Counsellor' },
                        ]}
                        disabled={isUpdating}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editFormData.is_active}
                          onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                          disabled={isUpdating}
                          className="rounded border-slate-300"
                        />
                        <span className="text-sm font-medium text-slate-700">Active</span>
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Modules (access)</label>
                      <MultiSelect
                        options={modules.map((m) => ({ value: m.id.toString(), label: m.name }))}
                        value={editFormData.module_ids.map((id) => id.toString())}
                        onChange={(vals) => setEditFormData({ ...editFormData, module_ids: vals.map(Number) })}
                        placeholder="Select modules..."
                        isSearchable={true}
                        disabled={isUpdating}
                      />
                    </div>
                  </>
                )}
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-slate-200 px-4 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditingAdmin(null);
                  setEditFormData({ email: '', password: '', type: 'data_entry', is_active: true, module_ids: [] });
                  setShowEditPassword(false);
                }}
                className="px-3 py-1.5 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-[#F6F8FA] transition-colors mr-2"
                disabled={isUpdating}
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleEditSubmit}
                disabled={isUpdating}
                className="px-3 py-1.5 text-sm bg-[#341050] hover:bg-[#2a0c40] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Updating...' : 'Update Admin'}
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
        title="Delete Admin User"
        message="Are you sure you want to delete this admin user? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonStyle="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}






