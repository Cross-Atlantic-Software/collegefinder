'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { FiFileText, FiArrowRight } from 'react-icons/fi';

export default function ExamCareerGoalsPage() {
  const router = useRouter();

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('admin_authenticated');
    const adminToken = localStorage.getItem('admin_token');
    if (!isAuthenticated || !adminToken) {
      router.replace('/admin/login');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-gray-900 mb-1">Exam Interests</h1>
            <p className="text-sm text-gray-600">
              Links between exams and interests are configured per exam.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-700 mb-4">
              To add or edit which interests are linked to an exam, open an exam from the
              Exams list and use the Interests section in the form.
            </p>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink text-white rounded-lg hover:bg-pink/90 transition-colors text-sm font-medium"
            >
              <FiFileText className="h-4 w-4" />
              Go to Exams
              <FiArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
