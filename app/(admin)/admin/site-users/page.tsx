import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import SimplifiedUsersTable from '@/components/admin/tables/SimplifiedUsersTable';
import { getAllUsersBasicInfo } from '@/lib/server/adminData';

export const dynamic = 'force-dynamic';

export default async function SiteUsersPage() {
  const { requireAdmin } = await import('@/lib/server/adminAuth');
  const admin = await requireAdmin();

  // Site Users is Super Admin only
  if (admin.type !== 'super_admin') {
    redirect('/admin');
  }

  let users;
  try {
    users = await getAllUsersBasicInfo();
  } catch (error) {
    console.error('Error fetching users:', error);
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader title="Site Users" subtitle="View and manage all site users." />
        <main className="flex-1 p-4 overflow-auto">
          <SimplifiedUsersTable initialUsers={users} />
        </main>
      </div>
    </div>
  );
}






