'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/layout/AdminSidebar';
import AdminHeader from '@/components/admin/layout/AdminHeader';
import { FiFileText, FiArrowRight } from 'react-icons/fi';

export default function ExamDatesPage() {
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
    <div className="min-h-screen bg-[#F6F8FA] flex">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <div className="mb-4">
            <h1 className="text-xl font-bold text-slate-900 mb-1">Exam Dates</h1>
            <p className="text-sm text-slate-600">
              Application window, exam date, result date, and application fee are configured per exam.
            </p>
          </div>
          <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <p className="text-sm text-slate-700 mb-4">
              To add or edit these, open an exam from the Exams list and use the Exam Details section in the form.
            </p>
            <Link
              href="/admin/exams"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-ink text-white rounded-lg hover:bg-brand-ink/90 transition-colors text-sm font-medium"
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
