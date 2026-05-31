import type { ReactNode } from 'react';
import { MdCheckCircle, MdError, MdHourglassTop } from 'react-icons/md';
import { FiRefreshCw } from 'react-icons/fi';
import type { ApplicationDirectoryStatus } from '@/api/applications';

export function applicationStatusDisplay(status: ApplicationDirectoryStatus): {
  icon: ReactNode;
  label: string;
  bgColor: string;
  textColor: string;
} {
  switch (status) {
    case 'pending':
      return {
        icon: <MdHourglassTop className="h-4 w-4" />,
        label: 'Pending Approval',
        bgColor: 'bg-amber-100',
        textColor: 'text-amber-700',
      };
    case 'approved':
      return {
        icon: <MdCheckCircle className="h-4 w-4" />,
        label: 'Ready to Start',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-700',
      };
    case 'running':
      return {
        icon: <FiRefreshCw className="h-4 w-4 animate-spin" />,
        label: 'In Progress',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-700',
      };
    case 'completed':
      return {
        icon: <MdCheckCircle className="h-4 w-4" />,
        label: 'Completed',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-700',
      };
    case 'failed':
      return {
        icon: <MdError className="h-4 w-4" />,
        label: 'Failed',
        bgColor: 'bg-red-100',
        textColor: 'text-red-700',
      };
    default:
      return {
        icon: <MdHourglassTop className="h-4 w-4" />,
        label: status,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-700',
      };
  }
}
