import type { DashboardCollege } from '@/api/auth/profile';
import { apiRequest } from '../client';
import { API_ENDPOINTS } from '../constants';
import { ApiResponse } from '../types';

export type PublicCollege = DashboardCollege;

export async function getCollegesByProgram(
  programId: number
): Promise<ApiResponse<{ colleges: PublicCollege[] }>> {
  const sp = new URLSearchParams();
  sp.set('program_id', String(programId));
  return apiRequest<{ colleges: PublicCollege[] }>(
    `${API_ENDPOINTS.PUBLIC.COLLEGES}?${sp.toString()}`,
    { method: 'GET' }
  );
}
