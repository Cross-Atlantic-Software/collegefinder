'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { getAllAdmins, createAdmin, updateAdmin, deleteAdmin, AdminUser } from '@/api';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiSave, FiShield, FiUser, FiSearch } from 'react-icons/fi';

export default function AdminUsersPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [allAdmins, setAllAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    type: 'user' as 'user' | 'super_admin',
  });

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
      return;
    }

    // Get current admin info
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      setCurrentAdmin(JSON.parse(adminUserStr));
    }

    fetchAdmins();
  }, [router]);

  // Debounced search handler
  useEffect(() => {
    if (allAdmins.length === 0) {
      setAdmins([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setAdmins(allAdmins);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allAdmins.filter(admin => {
        const email = admin.email.toLowerCase();
        return email.includes(searchLower);
      });
      setAdmins(filtered);
    }, 300); // 300ms debounce for smooth search

    return () => clearTimeout(timer);
  }, [searchQuery, allAdmins]);

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
    try {
      // Type is always 'user' for new admins created through UI
      const response = await createAdmin(
        formData.email,
        formData.password,
        'user'
      );
      if (response.success) {
        setShowCreateModal(false);
        setFormData({ email: '', password: '', type: 'user' });
        fetchAdmins();
      } else {
        setError(response.message || 'Failed to create admin user');
      }
    } catch (err) {
      setError('An error occurred while creating admin user');
      console.error('Error creating admin:', err);
    }
  };

  const handleUpdate = async (id: number, field: 'type' | 'is_active', value: any) => {
    try {
      const response = await updateAdmin(id, { [field]: value });
      if (response.success) {
        setEditingId(null);
        fetchAdmins();
      } else {
        setError(response.message || 'Failed to update admin user');
      }
    } catch (err) {
      setError('An error occurred while updating admin user');
      console.error('Error updating admin:', err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this admin user?')) return;

    try {
      const response = await deleteAdmin(id);
      if (response.success) {
        fetchAdmins();
      } else {
        setError(response.message || 'Failed to delete admin user');
      }
    } catch (err) {
      setError('An error occurred while deleting admin user');
      console.error('Error deleting admin:', err);
    }
  };

  const isSuperAdmin = currentAdmin?.type === 'super_admin';

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

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
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
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Admin Users</h1>
            <p className="text-sm text-gray-600">Manage admin users and their access levels.</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-3 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All admins</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allAdmins.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search admins by email"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
            >
              <FiPlus className="h-4 w-4" />
              Add Admin
            </button>
          </div>

          {/* Admins Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {isLoading ? (
              <div className="p-4 text-center text-sm text-gray-500">Loading admin users...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        EMAIL
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        TYPE
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        STATUS
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        DATE ADDED
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {admins.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                          No admin users found
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => {
                        const isEditing = editingId === admin.id;
                        const isSuperAdminType = admin.type === 'super_admin';
                        const isCurrentUser = admin.id === currentAdmin?.id;

                        return (
                          <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-full bg-darkGradient flex items-center justify-center text-white text-sm font-semibold">
                                  {admin.email.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-gray-900">{admin.email}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2">
                              {isEditing && !isSuperAdminType ? (
                                <select
                                  value={admin.type}
                                  onChange={(e) =>
                                    handleUpdate(admin.id, 'type', e.target.value)
                                  }
                                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                                >
                                  <option value="user">User</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isSuperAdminType
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {isSuperAdminType ? (
                                    <FiShield className="h-3 w-3" />
                                  ) : (
                                    <FiUser className="h-3 w-3" />
                                  )}
                                  {isSuperAdminType ? 'Super Admin' : 'User'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2">
                              {isEditing && !isSuperAdminType ? (
                                <select
                                  value={admin.is_active ? 'true' : 'false'}
                                  onChange={(e) =>
                                    handleUpdate(admin.id, 'is_active', e.target.value === 'true')
                                  }
                                  className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                                >
                                  <option value="true">Active</option>
                                  <option value="false">Inactive</option>
                                </select>
                              ) : (
                                <span
                                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    admin.is_active
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  {admin.is_active ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-xs text-gray-600">
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
                                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
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
                                          className="p-2 text-gray-300 cursor-not-allowed"
                                          title="Super admin cannot be edited"
                                        >
                                          <FiEdit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                          disabled
                                          className="p-2 text-gray-300 cursor-not-allowed"
                                          title="Super admin cannot be deleted"
                                        >
                                          <FiTrash2 className="h-4 w-4" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => setEditingId(admin.id)}
                                          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                          title="Edit admin"
                                        >
                                          <FiEdit2 className="h-4 w-4" />
                                        </button>
                                        {isCurrentUser ? (
                                          <button
                                            disabled
                                            className="p-2 text-gray-300 cursor-not-allowed"
                                            title="You cannot delete your own account"
                                          >
                                            <FiTrash2 className="h-4 w-4" />
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleDelete(admin.id)}
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
            <div className="bg-darkGradient text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create Admin User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ email: '', password: '', type: 'user' });
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email <span className="text-pink">*</span>
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password <span className="text-pink">*</span>
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    minLength={6}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="border-t border-gray-200 px-4 py-3 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ email: '', password: '', type: 'user' });
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                className="px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
              >
                Create Admin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

