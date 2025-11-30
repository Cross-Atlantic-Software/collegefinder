'use client';

import { useState, useEffect } from 'react';
import { SiteUser } from '@/lib/api';
import { FiChevronUp, FiChevronDown } from 'react-icons/fi';

interface UsersTableProps {
  users: SiteUser[];
  isLoading?: boolean;
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

export default function UsersTable({ users, isLoading }: UsersTableProps) {
  const [sortField, setSortField] = useState<'email' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [sortedUsers, setSortedUsers] = useState<SiteUser[]>(users);

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

  const handleSort = (field: 'email' | 'created_at') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="text-center text-gray-500">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-2 text-left">
                <button
                  onClick={() => handleSort('email')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-pink transition-colors"
                >
                  USER NAME
                  {sortField === 'email' && (
                    sortDirection === 'asc' ? (
                      <FiChevronUp className="h-3 w-3" />
                    ) : (
                      <FiChevronDown className="h-3 w-3" />
                    )
                  )}
                </button>
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                STATUS
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                EMAIL VERIFIED
              </th>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-700">
                AUTH PROVIDER
              </th>
              <th className="px-4 py-2 text-left">
                <button
                  onClick={() => handleSort('created_at')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-pink transition-colors"
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-4 text-center text-sm text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => {
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
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.email_verified
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {user.email_verified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                        {user.auth_provider || 'Email'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs text-gray-600">
                      {formatDate(user.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

