/**
 * Server-side data fetching for subjects
 */

import { cookies } from 'next/headers';
import { serverApiRequest } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

type Topic = {
  id: number;
  name: string;
  thumbnail: string | null;
  description: string | null;
  home_display: boolean;
  sort_order: number;
};

type SubjectSection = {
  id: string;
  name: string;
  topics: Topic[];
  allTopics: Topic[];
};

type SubjectsResponse = {
  subjects: SubjectSection[];
  requiresStreamSelection: boolean;
  message?: string;
  stream_id?: number;
};

/**
 * Get subjects filtered by user's stream_id (server-side)
 * Only fetches subjects that match the user's stream - filtering happens on server
 */
export async function getSubjectsByStream(): Promise<SubjectsResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await serverApiRequest<{
      success: boolean;
      data: SubjectsResponse;
      message?: string;
    }>(`${API_BASE_URL}/auth/profile/subjects`, token, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching subjects by stream:', error);
    return null;
  }
}

