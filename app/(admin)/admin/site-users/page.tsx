import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import SimplifiedUsersTable from '@/components/admin/SimplifiedUsersTable';
import { getAllUsersBasicInfo } from '@/lib/server/adminData';

export default async function SiteUsersPage() {
  // Check authentication - redirects to login if not authenticated
  const { requireAdmin } = await import('@/lib/server/adminAuth');
  await requireAdmin();

  // Fetch data on the server
  let users;
  try {
    users = await getAllUsersBasicInfo();
  } catch (error) {
    console.error('Error fetching users:', error);
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Site Users</h1>
            <p className="text-sm text-gray-600">View and manage all site users.</p>
          </div>

          <SimplifiedUsersTable initialUsers={users} />
        </main>
      </div>
    </div>
  );
}

