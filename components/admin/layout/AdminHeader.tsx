'use client';

import React, { useState, useEffect } from 'react';
import { formatAdminRoleLabel } from '@/lib/adminPermissions';

type AdminHeaderProps = {
  title?: string;
  subtitle?: string;
  /** Optional tabs rendered below the title row */
  tabs?: React.ReactNode;
};

export default function AdminHeader({ title, subtitle, tabs }: AdminHeaderProps) {
  const [adminInfo, setAdminInfo] = useState<{ email: string; type: string } | null>(null);

  useEffect(() => {
    const adminUserStr = localStorage.getItem('admin_user');
    if (adminUserStr) {
      try {
        const admin = JSON.parse(adminUserStr);
        queueMicrotask(() => setAdminInfo(admin));
      } catch (e) {
        console.error('Error parsing admin user:', e);
      }
    }
  }, []);

  const getAdminInitials = () => {
    if (adminInfo?.email) {
      return adminInfo.email.charAt(0).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-white/90 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/80">
      <div className="flex min-h-[52px] items-center justify-between gap-4 px-4 py-2.5 md:px-6">
        <div className="min-w-0 flex-1 pr-2">
          {title ? (
            <div>
              <h1 className="truncate text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-xl">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-0.5 truncate text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
              ) : null}
            </div>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <div className="text-right">
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              {formatAdminRoleLabel(adminInfo?.type)}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
              {adminInfo?.email || 'Admin'}
            </p>
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-highlight-100 text-sm font-bold text-brand-ink dark:bg-slate-800 dark:text-highlight-300">
            {getAdminInitials()}
          </div>
        </div>
      </div>
      {tabs ? (
        <div className="border-t border-slate-200/90 bg-white/95 px-4 dark:border-slate-800 dark:bg-slate-900/90 md:px-6">
          {tabs}
        </div>
      ) : null}
    </header>
  );
}
