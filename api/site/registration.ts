import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import type { ApiResponse } from '../types';

export async function checkEmailRegistrationStatus(
  email: string
): Promise<ApiResponse<{ exists: boolean; onboardingCompleted: boolean; hasPassword?: boolean }>> {
  return apiRequest<{ exists: boolean; onboardingCompleted: boolean; hasPassword?: boolean }>(
    API_ENDPOINTS.SITE.CHECK_EMAIL,
    {
      method: 'POST',
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    }
  );
}
