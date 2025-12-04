'use client';

interface UserCareerGoals {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  careerGoals: {
    interests: string[]; // Array of taxonomy IDs (as strings)
  } | null;
}

interface CareerGoalsTableProps {
  users: UserCareerGoals[];
  isLoading?: boolean;
}

export default function CareerGoalsTable({ users, isLoading }: CareerGoalsTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="text-gray-500">Loading career goals data...</div>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Interests
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
                {item.careerGoals ? (
                  <>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {item.careerGoals.interests && item.careerGoals.interests.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {item.careerGoals.interests.map((interest, idx) => (
                            <span 
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </>
                ) : (
                  <td colSpan={1} className="px-4 py-3 text-sm text-gray-500 text-center">
                    No career goals data
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

