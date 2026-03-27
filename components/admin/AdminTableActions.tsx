'use client';

import { FiEye, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';

interface AdminTableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  viewTitle?: string;
  editTitle?: string;
  deleteTitle?: string;
  loadingView?: boolean;
}

/**
 * Renders View / Edit / Delete action buttons based on admin permissions.
 * - View: shown to all
 * - Edit: hidden for data_entry
 * - Delete: hidden for data_entry and admin (super_admin only)
 */
export function AdminTableActions({
  onView,
  onEdit,
  onDelete,
  viewTitle = 'View',
  editTitle = 'Edit',
  deleteTitle = 'Delete',
  loadingView = false,
}: AdminTableActionsProps) {
  const { canEdit, canDelete } = useAdminPermissions();

  return (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          type="button"
          onClick={onView}
          disabled={loadingView}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          title={viewTitle}
        >
          <FiEye className="h-4 w-4" />
        </button>
      )}
      {onEdit && canEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="p-2 text-blue-600 hover:text-blue-800 transition-colors"
          title={editTitle}
        >
          <FiEdit2 className="h-4 w-4" />
        </button>
      )}
      {onDelete && canDelete && (
        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-red-600 hover:text-red-800 transition-colors"
          title={deleteTitle}
        >
          <FiTrash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
