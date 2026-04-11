'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Search, UserX, Trash2 } from 'lucide-react';
import { SiteUser, updateSiteUserStatus, deleteSiteUser } from '@/api';
import UserDetailsModal from '../modals/UserDetailsModal';
import { ConfirmationModal, useToast } from '@/components/shared';

interface SimplifiedUsersTableProps {
  initialUsers: SiteUser[];
  isLoading?: boolean;
}

function getInitials(nameOrEmail: string): string {
  if (!nameOrEmail || nameOrEmail.length === 0) return '?';
  return nameOrEmail.charAt(0).toUpperCase();
}

function getUserDisplayName(user: SiteUser): string {
  if (user.first_name || user.last_name) {
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    if (fullName) return fullName;
  }
  
  if (user.name) return user.name;
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Unknown User';
}

// Helper function to convert various boolean representations to boolean
function toBoolean(value: boolean | string | number | null | undefined): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value === 't' || value === 'true' || value === '1' || value === 'T' || value === 'TRUE';
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export default function SimplifiedUsersTable({ initialUsers, isLoading }: SimplifiedUsersTableProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusUpdatingId, setStatusUpdatingId] = useState<number | null>(null);
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const handleViewDetails = (userId: number) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
  };

  const handleToggleActive = async (user: SiteUser) => {
    const currentlyActive = toBoolean(user.is_active as boolean | string | number | null | undefined);
    const next = !currentlyActive;
    setStatusUpdatingId(user.id);
    try {
      const res = await updateSiteUserStatus(user.id, next);
      if (res.success) {
        showSuccess(next ? 'User activated' : 'User deactivated');
        router.refresh();
      } else {
        showError(res.message || 'Failed to update user');
      }
    } catch {
      showError('Failed to update user');
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleDeleteUserClick = (userId: number) => {
    setDeletingUserId(userId);
    setShowDeleteUserConfirm(true);
  };

  const handleDeleteUserConfirm = async () => {
    if (deletingUserId == null) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteSiteUser(deletingUserId);
      if (res.success) {
        showSuccess('User deleted');
        setShowDeleteUserConfirm(false);
        setDeletingUserId(null);
        router.refresh();
      } else {
        showError(res.message || 'Failed to delete user');
      }
    } catch {
      showError('Failed to delete user');
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Filter users based on search query
  const filteredUsers = initialUsers.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.first_name?.toLowerCase().includes(query) ||
      user.last_name?.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-slate-500">Loading users...</div>
      </div>
    );
  }

  if (initialUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-slate-500">No users found</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg hover:bg-[#F6F8FA] transition-colors">
            <span className="text-xs font-medium text-slate-700">All users</span>
            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
              {initialUsers.length}
            </span>
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#341050]/25 focus:border-[#341050] outline-none w-64 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F6F8FA] border-b border-slate-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  USER
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  PHONE
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  STATUS
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  EMAIL VERIFIED
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  DATE ADDED
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-slate-700">
                  LAST LOGIN
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-slate-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-slate-500">
                    No users found matching your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = getUserDisplayName(user);
                  const initials = getInitials(displayName);
                  
                  return (
                    <tr key={user.id} className="hover:bg-[#F6F8FA] transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-highlight-100 flex items-center justify-center text-[#341050] text-sm font-semibold">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {displayName}
                            </div>
                            <div className="text-xs text-slate-500">{user.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-900">
                        {user.phone_number ? String(user.phone_number) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            toBoolean(user.is_active as boolean | string | number | null | undefined)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {toBoolean(user.is_active as boolean | string | number | null | undefined) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            toBoolean(user.email_verified as boolean | string | number | null | undefined)
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {toBoolean(user.email_verified as boolean | string | number | null | undefined) ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-2 text-xs text-slate-600">
                        {user.last_login
                          ? formatDate(user.last_login)
                          : <span className="text-slate-400">Never</span>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <div className="flex flex-wrap items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewDetails(user.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#341050] bg-[#341050]/10 rounded-lg hover:bg-[#341050]/20 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </button>
                          <button
                            type="button"
                            disabled={statusUpdatingId === user.id}
                            onClick={() => handleToggleActive(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors disabled:opacity-50"
                            title={toBoolean(user.is_active as boolean | string | number | null | undefined) ? 'Deactivate account' : 'Activate account'}
                          >
                            <UserX className="h-3.5 w-3.5" />
                            {statusUpdatingId === user.id
                              ? '…'
                              : toBoolean(user.is_active as boolean | string | number | null | undefined)
                                ? 'Deactivate'
                                : 'Activate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUserClick(user.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                            title="Permanently delete user"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
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

      <UserDetailsModal
        userId={selectedUserId}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <ConfirmationModal
        isOpen={showDeleteUserConfirm}
        onClose={() => {
          setShowDeleteUserConfirm(false);
          setDeletingUserId(null);
        }}
        onConfirm={handleDeleteUserConfirm}
        title="Delete site user"
        message="This permanently removes the user and related data that is configured to cascade. This cannot be undone."
        confirmText="Delete user"
        cancelText="Cancel"
        isLoading={isDeletingUser}
        confirmButtonStyle="danger"
      />
    </>
  );
}

