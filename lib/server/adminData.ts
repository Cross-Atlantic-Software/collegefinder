/**
 * Server-side data fetching for admin pages
 */

import { requireAdmin } from './adminAuth';
import { serverApiRequest } from './api';

import type { SiteUser } from '@/api/types';

export interface UserAcademics {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  academics: {
    matric_board: string | null;
    matric_school_name: string | null;
    matric_passing_year: number | null;
    matric_roll_number: string | null;
    matric_total_marks: number | null;
    matric_obtained_marks: number | null;
    matric_percentage: number | null;
    postmatric_board: string | null;
    postmatric_school_name: string | null;
    postmatric_passing_year: number | null;
    postmatric_roll_number: string | null;
    postmatric_total_marks: number | null;
    postmatric_obtained_marks: number | null;
    postmatric_percentage: number | null;
    stream: string | null;
    subjects: Array<{ name: string; percent: number }> | null;
  } | null;
}

export interface UserCareerGoals {
  user: {
    id: number;
    email: string;
    name: string | null;
  };
  careerGoals: {
    interests: string[];
  } | null;
}

/**
 * Fetch all users with basic info
 */
export async function getAllUsersBasicInfo(): Promise<SiteUser[]> {
  const { getAdminToken } = await import('./adminAuth');
  const token = await getAdminToken();
  
  if (!token) {
    throw new Error('Admin token not found');
  }

  const response = await serverApiRequest<{
    success: boolean;
    data: { users: SiteUser[] };
  }>(`/admin/users/basic-info`, token);

  if (!response.success || !response.data) {
    throw new Error('Failed to fetch users');
  }

  return response.data.users;
}

/**
 * Fetch all users with academics
 */
export async function getAllUsersAcademics(): Promise<UserAcademics[]> {
  const { getAdminToken } = await import('./adminAuth');
  const token = await getAdminToken();
  
  if (!token) {
    throw new Error('Admin token not found');
  }

  const response = await serverApiRequest<{
    success: boolean;
    data: { users: UserAcademics[] };
  }>(`/admin/users/academics`, token);

  if (!response.success || !response.data) {
    throw new Error('Failed to fetch users academics');
  }

  return response.data.users;
}

/**
 * Fetch all users with career goals
 */
export async function getAllUsersCareerGoals(): Promise<UserCareerGoals[]> {
  const { getAdminToken } = await import('./adminAuth');
  const token = await getAdminToken();
  
  if (!token) {
    throw new Error('Admin token not found');
  }

  const response = await serverApiRequest<{
    success: boolean;
    data: { users: UserCareerGoals[] };
  }>(`/admin/users/career-goals`, token);

  if (!response.success || !response.data) {
    throw new Error('Failed to fetch users career goals');
  }

  return response.data.users;
}

