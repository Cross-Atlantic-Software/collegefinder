'use client';

import { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { SiteUser } from '@/api';
import UserDetailsModal from '../modals/UserDetailsModal';

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
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleViewDetails = (userId: number) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUserId(null);
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading users...</div>
      </div>
    );
  }

  if (initialUsers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">No users found</div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="text-xs font-medium text-gray-700">All users</span>
            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
              {initialUsers.length}
            </span>
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  USER
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  PHONE
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  STATUS
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  EMAIL VERIFIED
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  DATE ADDED
                </th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                  LAST LOGIN
                </th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-gray-700">
                  ACTIONS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-4 text-center text-sm text-gray-500">
                    No users found matching your search
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const displayName = getUserDisplayName(user);
                  const initials = getInitials(displayName);
                  
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-darkGradient flex items-center justify-center text-white text-sm font-semibold">
                            {initials}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {displayName}
                            </div>
                            <div className="text-xs text-gray-500">{user.email || 'No email'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {user.phone_number ? String(user.phone_number) : '-'}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            toBoolean(user.is_active as boolean | string | number | null | undefined)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
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
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {toBoolean(user.email_verified as boolean | string | number | null | undefined) ? 'Verified' : 'Not Verified'}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-600">
                        {user.last_login
                          ? formatDate(user.last_login)
                          : <span className="text-gray-400">Never</span>}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleViewDetails(user.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-pink bg-pink/10 rounded-lg hover:bg-pink/20 transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </button>
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
    </>
  );
}

