import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import UsersTableClient from '@/components/admin/UsersTableClient';
import { requireAdmin } from '@/lib/server/adminAuth';
import { getAllUsersBasicInfo } from '@/lib/server/adminData';

export default async function BasicInfoPage() {
  // Check authentication - redirects to login if not authenticated
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
            <h1 className="text-xl font-bold text-gray-900 mb-1">Site Users - Basic Info</h1>
            <p className="text-sm text-gray-600">View and manage user basic information.</p>
          </div>

          <UsersTableClient initialUsers={users} />
        </main>
      </div>
    </div>
  );
}
