/**
 * Admin permissions - centralized logic for role-based access
 *
 * User Types:
 * - super_admin: Full access, can manage users, delete, download Excel
 * - admin: Add + edit + Excel upload; NO delete, NO Excel download
 * - data_entry: Add only; NO edit, NO delete, NO Excel download
 *
 * Data Entry and Admin have module-based access (assigned at creation).
 * Neither has access to Users module (site users, admin users).
 */

import type { AdminUserType } from '@/api/types';

export type AdminUserTypePermission = AdminUserType;

/** Can edit existing records (PUT). Data Entry cannot. */
export function canEdit(type: AdminUserTypePermission | undefined): boolean {
  return type === 'admin' || type === 'super_admin';
}

/** Can delete records. Only Super Admin. */
export function canDelete(type: AdminUserTypePermission | undefined): boolean {
  return type === 'super_admin';
}

/** Can download Excel (template or full data). Only Super Admin. */
export function canDownloadExcel(type: AdminUserTypePermission | undefined): boolean {
  return type === 'super_admin';
}

/** Can create new admin users. Only Super Admin. */
export function canCreateAdminUsers(type: AdminUserTypePermission | undefined): boolean {
  return type === 'super_admin';
}

/** Can access Users module (site users, admin users, modules). Only Super Admin. */
export function canAccessUsersModule(type: AdminUserTypePermission | undefined): boolean {
  return type === 'super_admin';
}

/** Can add new records (POST). All admin types can add within their modules. */
export function canAdd(type: AdminUserTypePermission | undefined): boolean {
  return !!type && ['data_entry', 'admin', 'super_admin', 'counsellor'].includes(type);
}

/** Human-readable role for admin header / UI */
export function formatAdminRoleLabel(type: string | undefined | null): string {
  switch (type) {
    case 'super_admin':
      return 'Super Admin';
    case 'admin':
      return 'Admin';
    case 'data_entry':
      return 'Data Entry';
    case 'counsellor':
      return 'Counsellor';
    default:
      return 'Admin';
  }
}
