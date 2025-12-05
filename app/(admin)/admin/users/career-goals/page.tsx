import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import CareerGoalsTableClient from '@/components/admin/CareerGoalsTableClient';
// Dynamic import to avoid bundling server-only code
import { getAllUsersCareerGoals } from '@/lib/server/adminData';

export default async function CareerGoalsPage() {
  // Check authentication - redirects to login if not authenticated
  const { requireAdmin } = await import('@/lib/server/adminAuth');
  await requireAdmin();

  // Fetch data on the server
  let users;
  try {
    users = await getAllUsersCareerGoals();
  } catch (error) {
    console.error('Error fetching users career goals:', error);
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Site Users - Career Goals</h1>
            <p className="text-sm text-gray-600">View and manage user career goals and interests.</p>
          </div>

          <CareerGoalsTableClient initialUsers={users} />
        </main>
      </div>
    </div>
  );
}
