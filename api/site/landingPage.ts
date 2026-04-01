import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';
import type { LandingPageContent } from '@/types/landingPage';

export async function getLandingPageContent(): Promise<
  ApiResponse<{ content: LandingPageContent }>
> {
  return apiRequest(`${API_ENDPOINTS.SITE.LANDING_PAGE}`, { method: 'GET' });
}
