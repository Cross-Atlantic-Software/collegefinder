import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import AcademicsTableClient from '@/components/admin/AcademicsTableClient';
import { requireAdmin } from '@/lib/server/adminAuth';
import { getAllUsersAcademics } from '@/lib/server/adminData';

export default async function AcademicsPage() {
  // Check authentication - redirects to login if not authenticated
  await requireAdmin();

  // Fetch data on the server
  let users;
  try {
    users = await getAllUsersAcademics();
  } catch (error) {
    console.error('Error fetching users academics:', error);
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Site Users - Academics</h1>
            <p className="text-sm text-gray-600">View and manage user academic information.</p>
          </div>

          <AcademicsTableClient initialUsers={users} />
        </main>
      </div>
    </div>
  );
}
