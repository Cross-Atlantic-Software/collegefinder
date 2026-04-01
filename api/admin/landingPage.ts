import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';
import type { LandingPageContent } from '@/types/landingPage';

export async function getAdminLandingPageContent(): Promise<
  ApiResponse<{ content: LandingPageContent }>
> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LANDING_PAGE}`, { method: 'GET' });
}

export async function updateAdminLandingPageContent(
  content: LandingPageContent
): Promise<ApiResponse<{ content: LandingPageContent }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LANDING_PAGE}`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}
