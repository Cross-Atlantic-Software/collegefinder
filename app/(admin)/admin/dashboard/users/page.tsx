'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import UsersTable from '@/components/admin/UsersTable';
import { getAllUsers, SiteUser } from '@/api';
import { FiSearch } from 'react-icons/fi';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<SiteUser[]>([]);
  const [allUsers, setAllUsers] = useState<SiteUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.push('/admin/login');
      return;
    }

    // Fetch users
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        const response = await getAllUsers();
        if (response.success && response.data) {
          setAllUsers(response.data.users);
          setUsers(response.data.users);
        } else {
          setError(response.message || 'Failed to fetch users');
        }
      } catch (err) {
        setError('An error occurred while fetching users');
        console.error('Error fetching users:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [router]);

  // Debounced search handler
  useEffect(() => {
    if (allUsers.length === 0) {
      setUsers([]);
      return;
    }
    
    const timer = setTimeout(() => {
      if (!searchQuery.trim()) {
        setUsers(allUsers);
        return;
      }
      const searchLower = searchQuery.toLowerCase();
      const filtered = allUsers.filter(user => {
        const email = user.email.toLowerCase();
        const name = user.name?.toLowerCase() || '';
        return email.includes(searchLower) || name.includes(searchLower);
      });
      setUsers(filtered);
    }, 300); // 300ms debounce for smooth search

    return () => clearTimeout(timer);
  }, [searchQuery, allUsers]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/admin/login')}
            className="text-pink hover:underline"
          >
            Go to login
          </button>
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Site Users</h1>
            <p className="text-sm text-gray-600">Manage registered site users and their information.</p>
          </div>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <span className="text-xs font-medium text-gray-700">All users</span>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {allUsers.length}
                </span>
              </button>
              <div className="relative">
                <FiSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users by email or name"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink focus:border-pink outline-none w-64 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Users Table */}
          <UsersTable users={users} isLoading={isLoading} />
        </main>
      </div>
    </div>
  );
}

