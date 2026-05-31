import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export type ApplicationDirectoryStatus = 'pending' | 'approved' | 'running' | 'completed' | 'failed';

export type ApplicationDirectoryTab = 'all' | 'approved' | 'running' | 'completed';

export type PublicApplication = {
  id: number;
  exam_id: number;
  exam_name: string;
  exam_slug: string;
  status: ApplicationDirectoryStatus;
  created_at: string;
};

export async function getApplicationsDirectory(
  tab: ApplicationDirectoryTab = 'all'
): Promise<
  ApiResponse<{
    applications: PublicApplication[];
    tab: ApplicationDirectoryTab;
    isDemo?: boolean;
  }>
> {
  const sp = new URLSearchParams();
  sp.set('tab', tab);
  return apiRequest<{
    applications: PublicApplication[];
    tab: ApplicationDirectoryTab;
    isDemo?: boolean;
  }>(`${API_ENDPOINTS.PUBLIC.APPLICATIONS_DIRECTORY}?${sp.toString()}`, {
    method: 'GET',
  });
}
