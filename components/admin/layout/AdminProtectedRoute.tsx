'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem('admin_authenticated');
      const token = localStorage.getItem('admin_token');
      if (!auth || !token) {
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F6F8FA] dark:bg-slate-950">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-2 border-slate-200 border-t-[#341050] dark:border-slate-700 dark:border-t-highlight-300"
            aria-hidden
          />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

