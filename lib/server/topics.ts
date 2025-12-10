/**
 * Server-side data fetching for topics
 */

import { cookies } from 'next/headers';
import { serverApiRequest } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

type Purpose = {
  id: number;
  name: string;
  status: boolean;
};

type Lecture = {
  id: number;
  name: string;
  content_type: 'VIDEO' | 'ARTICLE';
  video_file: string | null;
  article_content: string | null;
  thumbnail: string | null;
  description: string | null;
  purposes: Purpose[];
  sort_order: number;
};

type Subtopic = {
  id: number;
  name: string;
  description: string | null;
  sort_order: number;
  lectures: Lecture[];
};

type TopicResponse = {
  topic: {
    id: number;
    name: string;
    thumbnail: string | null;
    description: string | null;
    sub_id: number;
  };
  subtopics: Subtopic[];
};

/**
 * Get topic by name with subtopics and lectures (server-side)
 */
export async function getTopicByName(topicName: string): Promise<TopicResponse | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await serverApiRequest<{
      success: boolean;
      data: TopicResponse;
      message?: string;
    }>(`${API_BASE_URL}/auth/profile/topics/${encodeURIComponent(topicName)}`, token, {
      method: 'GET',
    });

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching topic by name:', error);
    return null;
  }
}

