import type { PublicApplication } from '@/api/applications';

export const APPLICATIONS_DIRECTORY_PREVIEW_COUNT = 5;

export const APPLICATION_DIRECTORY_TABS = [
  { id: 'all' as const, label: 'All' },
  { id: 'approved' as const, label: 'Ready' },
  { id: 'running' as const, label: 'In Progress' },
  { id: 'completed' as const, label: 'Completed' },
];

export function splitApplicationsForPublicDirectory(applications: PublicApplication[]): {
  visible: PublicApplication[];
  lockedPreview: PublicApplication | null;
  hasMoreLocked: boolean;
} {
  const visible = applications.slice(0, APPLICATIONS_DIRECTORY_PREVIEW_COUNT);
  const lockedPreview = applications[APPLICATIONS_DIRECTORY_PREVIEW_COUNT] ?? null;
  return {
    visible,
    lockedPreview,
    hasMoreLocked: applications.length > APPLICATIONS_DIRECTORY_PREVIEW_COUNT,
  };
}
