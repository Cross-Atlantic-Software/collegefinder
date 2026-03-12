'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    if (!isAuthenticated) {
      router.replace('/admin/login');
      return;
    }
    // Redirect to users page for now (defer setState to avoid set-state-in-effect)
    queueMicrotask(() => setIsRedirecting(true));
    setTimeout(() => {
      router.replace('/admin/dashboard/users');
    }, 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isRedirecting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6">
          <div className="text-center text-gray-500">Redirecting...</div>
        </main>
      </div>
    </div>
  );
}

