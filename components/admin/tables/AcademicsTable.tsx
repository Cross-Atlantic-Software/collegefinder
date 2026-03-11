'use client';

import type { UserAcademics } from '@/lib/server/adminData';

interface AcademicsTableProps {
  users: UserAcademics[];
  isLoading?: boolean;
}

export default function AcademicsTable({ users, isLoading }: AcademicsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading academics data...</div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">No users found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Nickname
              </th>
              {/* Matric (10th) Columns */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                10th Board
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                10th School
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                10th Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                10th %
              </th>
              {/* Post-Matric (12th) Columns */}
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                12th Board
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                12th School
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                12th Year
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stream
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                12th %
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Subjects
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((item) => (
              <tr key={item.user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.user.id}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.user.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                  {item.user.name || '-'}
                </td>
                {item.academics ? (
                  <>
                    {/* Matric (10th) Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.matric_board || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.matric_school_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.matric_passing_year || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.matric_percentage !== null 
                        ? `${item.academics.matric_percentage}%` 
                        : '-'}
                    </td>
                    {/* Post-Matric (12th) Data */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.postmatric_board || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.postmatric_school_name || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.postmatric_passing_year || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.stream || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {item.academics.postmatric_percentage !== null 
                        ? `${item.academics.postmatric_percentage}%` 
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.academics.subjects && item.academics.subjects.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.academics.subjects.map((subject, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs"
                            >
                              {subject.name} ({subject.percent}%)
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </>
                ) : (
                  <>
                    <td colSpan={10} className="px-4 py-3 text-sm text-gray-500 text-center">
                      No academic data
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
