/**
 * Admin user types and permission matrix
 *
 * User Types:
 * - super_admin: Full access. Can manage users (site + admin), delete, download Excel, create admin users.
 * - admin: Add + edit + Excel upload within assigned modules. NO delete, NO Excel download, NO user module access.
 * - data_entry: Add only within assigned modules. NO edit, NO delete, NO Excel download, NO user module access.
 *
 * Module access:
 * - Data Entry and Admin: Assigned modules at creation (admin_user_modules). Users module is never assignable.
 * - Super Admin: Bypasses all module checks.
 */

const ADMIN_TYPES = {
  DATA_ENTRY: 'data_entry',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
};

/** Only super_admin can delete records */
const canDelete = (type) => type === ADMIN_TYPES.SUPER_ADMIN;

/** Admin and super_admin can edit (PUT). Data Entry cannot. */
const canEdit = (type) => type === ADMIN_TYPES.ADMIN || type === ADMIN_TYPES.SUPER_ADMIN;

/** Only super_admin can download Excel (template or full data) */
const canDownloadExcel = (type) => type === ADMIN_TYPES.SUPER_ADMIN;

/** Only super_admin can create/manage admin users */
const canCreateAdminUsers = (type) => type === ADMIN_TYPES.SUPER_ADMIN;

/** Users module (site users, admin users, modules) - super_admin only */
const canAccessUsersModule = (type) => type === ADMIN_TYPES.SUPER_ADMIN;

module.exports = {
  ADMIN_TYPES,
  canDelete,
  canEdit,
  canDownloadExcel,
  canCreateAdminUsers,
  canAccessUsersModule,
};
