import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { getAdminUser } from '@/lib/server/adminAuth';

export default async function AdminPage() {
  const admin = await getAdminUser();
  if (!admin) {
    redirect('/admin/login');
  }
  // Super Admin: default to Site Users; others stay on dashboard
  if (admin.type === 'super_admin') {
    redirect('/admin/site-users');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-4 overflow-auto">
          <div className="mb-3">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Dashboard</h1>
            <p className="text-sm text-gray-600">
              Use the sidebar to access the modules you have permission for.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}


