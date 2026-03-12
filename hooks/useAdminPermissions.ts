'use client';

import { useState, useEffect } from 'react';
import {
  canEdit,
  canDelete,
  canDownloadExcel,
  canCreateAdminUsers,
  canAccessUsersModule,
  canAdd,
} from '@/lib/adminPermissions';
import type { AdminUserType } from '@/api/types';

interface AdminUser {
  id: number;
  email: string;
  type: AdminUserType;
  module_codes?: string[];
}

export interface AdminPermissions {
  type: AdminUserType | null;
  admin: AdminUser | null;
  canEdit: boolean;
  canDelete: boolean;
  canDownloadExcel: boolean;
  canCreateAdminUsers: boolean;
  canAccessUsersModule: boolean;
  canAdd: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isDataEntry: boolean;
}

export function useAdminPermissions(): AdminPermissions {
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('admin_user');
      if (s) {
        const parsed = JSON.parse(s);
        setAdmin(parsed);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    }
  }, []);

  const type = admin?.type ?? null;

  return {
    type,
    admin,
    canEdit: canEdit(type ?? undefined),
    canDelete: canDelete(type ?? undefined),
    canDownloadExcel: canDownloadExcel(type ?? undefined),
    canCreateAdminUsers: canCreateAdminUsers(type ?? undefined),
    canAccessUsersModule: canAccessUsersModule(type ?? undefined),
    canAdd: canAdd(type ?? undefined),
    isSuperAdmin: type === 'super_admin',
    isAdmin: type === 'admin',
    isDataEntry: type === 'data_entry',
  };
}
