import { apiRequest } from '../client';
import type { ApiResponse } from '../types';

export type SocialAccountType = 'project' | 'founder';

export interface SocialHealthData {
  ok: boolean;
  service: string;
  googleKeyConfigured: boolean;
}

/** No auth required; use to verify Next → Node backend connectivity. */
export async function getSocialApiHealth(): Promise<ApiResponse<SocialHealthData>> {
  return apiRequest<SocialHealthData>('/social/health', { method: 'GET' }, { timeout: 8000 });
}

export interface GenerateSocialRequest {
  thoughts: string;
  accountType: SocialAccountType;
  previousPosts?: string[];
}

export interface SocialImagePrompts {
  linkedin: string;
  twitter: string;
  instagram: string[];
}

export interface SocialGenerateResult {
  title: string;
  article: string;
  linkedin: string;
  twitter: string[];
  instagramSlides: string[];
  imagePrompts: SocialImagePrompts;
}

export async function generateSocialPost(
  body: GenerateSocialRequest
): Promise<ApiResponse<SocialGenerateResult>> {
  return apiRequest<SocialGenerateResult>('/social/generate', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { timeout: 120000 });
}
