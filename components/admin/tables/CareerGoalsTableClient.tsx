'use client';

import { useState, useEffect } from 'react';
import CareerGoalsTable from './CareerGoalsTable';
import CareerGoalsTaxonomyModal from '../modals/CareerGoalsTaxonomyModal';
import { FiSearch, FiSettings } from 'react-icons/fi';

interface UserCareerGoals {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  careerGoals: {
    interests: string[];
  } | null;
}

interface CareerGoalsTableClientProps {
  initialUsers: UserCareerGoals[];
}

export default function CareerGoalsTableClient({ initialUsers }: CareerGoalsTableClientProps) {
  const [users, setUsers] = useState<UserCareerGoals[]>(initialUsers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTaxonomyModal, setShowTaxonomyModal] = useState(false);

  useEffect(() => {
    if (initialUsers.length === 0) {
      setUsers([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setUsers(initialUsers);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = initialUsers.filter(item => {
        const email = item.user.email.toLowerCase();
        const name = item.user.name?.toLowerCase() || '';
        const interests = item.careerGoals?.interests?.join(' ') || '';
        return email.includes(searchLower) || name.includes(searchLower) || 
               interests.toLowerCase().includes(searchLower);
      });
      setUsers(filtered);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, initialUsers]);

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
            <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by email, name, interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
            />
          </div>
        </div>
        <button
          onClick={() => setShowTaxonomyModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-darkGradient text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <FiSettings className="h-4 w-4" />
          Manage Goals
        </button>
      </div>

      <CareerGoalsTable users={users} isLoading={false} />

      {/* Career Goals Taxonomy Modal */}
      <CareerGoalsTaxonomyModal
        isOpen={showTaxonomyModal}
        onClose={() => setShowTaxonomyModal(false)}
      />
    </>
  );
}

