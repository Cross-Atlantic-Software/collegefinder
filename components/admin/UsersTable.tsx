'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { SiteUser, createUser, updateUser, deleteUser } from '@/lib/api';
import { FiChevronUp, FiChevronDown, FiEdit2, FiTrash2, FiX, FiSave } from 'react-icons/fi';

interface UsersTableProps {
  users: SiteUser[];
  isLoading?: boolean;
  onUserCreated?: () => void;
  onUserUpdated?: () => void;
  onUserDeleted?: () => void;
}

export interface UsersTableRef {
  showCreateModal: () => void;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function getInitials(nameOrEmail: string): string {
  return nameOrEmail.charAt(0).toUpperCase();
}

function getUserDisplayName(user: SiteUser): string {
  if (user.name) return user.name;
  return user.email.split('@')[0];
}

const UsersTable = forwardRef<UsersTableRef, UsersTableProps>(
  ({ users, isLoading, onUserCreated, onUserUpdated, onUserDeleted }, ref) => {
    const [sortField, setSortField] = useState<'email' | 'created_at'>('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortedUsers, setSortedUsers] = useState<SiteUser[]>(users);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingUser, setEditingUser] = useState<Partial<SiteUser> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form state for create
    const [createFormData, setCreateFormData] = useState({
      email: '',
      name: '',
    });

  useEffect(() => {
    const sorted = [...users].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      if (sortField === 'email') {
        aValue = a.email.toLowerCase();
        bValue = b.email.toLowerCase();
      } else {
        aValue = new Date(a.created_at).getTime();
        bValue = new Date(b.created_at).getTime();
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    setSortedUsers(sorted);
  }, [users, sortField, sortDirection]);

  useImperativeHandle(ref, () => ({
    showCreateModal: () => setShowCreateModal(true),
  }));

  const handleSort = (field: 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await createUser(
        createFormData.email,
        createFormData.name || undefined
      );
      if (response.success) {
        setShowCreateModal(false);
        setCreateFormData({ email: '', name: '' });
        onUserCreated?.();
      } else {
        setError(response.message || 'Failed to create user');
      }
    } catch (err) {
      setError('An error occurred while creating user');
      console.error('Error creating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user: SiteUser) => {
    setEditingId(user.id);
    setEditingUser({
      email: user.email,
      name: user.name || '',
      email_verified: user.email_verified,
      is_active: user.is_active,
    });
  };

  const handleUpdate = async (id: number) => {
    if (!editingUser) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await updateUser(id, {
        email: editingUser.email,
        name: editingUser.name || undefined,
        email_verified: editingUser.email_verified,
        is_active: editingUser.is_active,
      });
      if (response.success) {
        setEditingId(null);
        setEditingUser(null);
        onUserUpdated?.();
      } else {
        setError(response.message || 'Failed to update user');
      }
    } catch (err) {
      setError('An error occurred while updating user');
      console.error('Error updating user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await deleteUser(id);
      if (response.success) {
        onUserDeleted?.();
      } else {
        setError(response.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('An error occurred while deleting user');
      console.error('Error deleting user:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingUser(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden" data-users-table>
        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-4 py-2 text-sm">
            {error}
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-[#140E27] to-[#341050] border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('email')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-pink transition-colors"
                  >
                    USER
                    {sortField === 'email' && (
                      sortDirection === 'asc' ? (
                        <FiChevronUp className="h-3 w-3" />
                      ) : (
                        <FiChevronDown className="h-3 w-3" />
                      )
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                  STATUS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                  EMAIL VERIFIED
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                  AUTH PROVIDER
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('created_at')}
                    className="flex items-center gap-1.5 text-xs font-semibold text-white hover:text-pink transition-colors"
                  >
                    DATE ADDED
                    {sortField === 'created_at' && (
                      sortDirection === 'asc' ? (
                        <FiChevronUp className="h-3 w-3" />
                      ) : (
                        <FiChevronDown className="h-3 w-3" />
                      )
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-white">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                sortedUsers.map((user) => {
                  const displayName = getUserDisplayName(user);
                  const initials = getInitials(displayName);
                  const isEditing = editingId === user.id;
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="email"
                              value={editingUser?.email || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Name (optional)"
                              value={editingUser?.name || ''}
                              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#140E27] to-[#341050] flex items-center justify-center text-white text-sm font-semibold">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {displayName}
                              </div>
                              <div className="text-xs text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editingUser?.is_active ? 'true' : 'false'}
                            onChange={(e) => setEditingUser({ ...editingUser, is_active: e.target.value === 'true' })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                          >
                            <option value="true">Active</option>
                            <option value="false">Inactive</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing ? (
                          <select
                            value={editingUser?.email_verified ? 'true' : 'false'}
                            onChange={(e) => setEditingUser({ ...editingUser, email_verified: e.target.value === 'true' })}
                            className="px-2 py-1 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                          >
                            <option value="false">Not Verified</option>
                            <option value="true">Verified</option>
                          </select>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              user.email_verified
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {user.email_verified ? 'Verified' : 'Not Verified'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                          {user.auth_provider || 'Email'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleUpdate(user.id)}
                                disabled={isSubmitting}
                                className="p-2 text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                                title="Save changes"
                              >
                                <FiSave className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                disabled={isSubmitting}
                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                                title="Cancel editing"
                              >
                                <FiX className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(user)}
                                className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
                                title="Edit user"
                              >
                                <FiEdit2 className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="p-2 text-red-600 hover:text-red-800 transition-colors"
                                title="Delete user"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
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
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#140E27] to-[#341050] text-white px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold">Create User</h2>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateFormData({ email: '', name: '' });
                  setError(null);
                }}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-auto p-4">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 text-sm rounded-lg">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email <span className="text-pink">*</span>
                  </label>
                  <input
                    type="email"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    required
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Name <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
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
                  setCreateFormData({ email: '', name: '' });
                  setError(null);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-3 py-1.5 text-sm bg-gradient-to-r from-[#140E27] to-[#341050] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});

UsersTable.displayName = 'UsersTable';

export default UsersTable;

