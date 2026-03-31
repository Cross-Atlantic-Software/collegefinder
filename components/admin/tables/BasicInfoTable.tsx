'use client';

import { SiteUser } from '@/api';

interface BasicInfoTableProps {
  users: SiteUser[];
  isLoading?: boolean;
}

export default function BasicInfoTable({ users, isLoading }: BasicInfoTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-slate-500">Loading users...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
        <div className="text-slate-500">No users found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-[#F6F8FA]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Nickname
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                First Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Last Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Date of Birth
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Gender
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Phone Number
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                State
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                District
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Email Verified
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created At
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F6F8FA]">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.name || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.first_name || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.last_name || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.date_of_birth 
                    ? new Date(user.date_of_birth).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.gender || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.phone_number || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.state || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900">
                  {user.district || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user.email_verified 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {user.email_verified ? 'Verified' : 'Unverified'}
                  </span>
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                  {user.created_at 
                    ? new Date(user.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

