import { apiRequest } from '../../client';
import { API_ENDPOINTS } from '../../constants';
import { ApiResponse } from '../../types';

export interface CollegeCourse {
  id: number;
  college_id: number;
  college_name?: string;
  stream_id: number | null;
  stream_name?: string | null;
  level_id: number | null;
  level_name?: string | null;
  program_id: number | null;
  program_name?: string | null;
  title: string;
  summary: string | null;
  duration: string | null;
  curriculum_detail: string | null;
  admission_process: string | null;
  eligibility: string | null;
  placements: string | null;
  scholarship: string | null;
  brochure_url: string | null;
  fee_per_sem: number | null;
  total_fee: number | null;
  subject_ids: number[] | null;
  exam_ids: number[] | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get all college courses (for admin)
 */
export async function getAllCollegeCourses(): Promise<ApiResponse<{
  courses: CollegeCourse[];
}>> {
  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_COURSES, {
    method: 'GET',
  });
}

/**
 * Get course by ID
 */
export async function getCollegeCourseById(id: number): Promise<ApiResponse<{
  course: CollegeCourse;
}>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_COURSES}/${id}`, {
    method: 'GET',
  });
}

/**
 * Create new course
 */
export async function createCollegeCourse(data: {
  college_id: number;
  stream_id?: number | null;
  level_id?: number | null;
  program_id?: number | null;
  title: string;
  summary?: string | null;
  duration?: string | null;
  curriculum_detail?: string | null;
  admission_process?: string | null;
  eligibility?: string | null;
  placements?: string | null;
  scholarship?: string | null;
  brochure_url?: string | null;
  fee_per_sem?: number | null;
  total_fee?: number | null;
  subject_ids?: number[] | null;
  exam_ids?: number[] | null;
  brochure?: File;
}): Promise<ApiResponse<{
  course: CollegeCourse;
}>> {
  const formData = new FormData();
  
  formData.append('college_id', data.college_id.toString());
  if (data.stream_id !== undefined && data.stream_id !== null) {
    formData.append('stream_id', data.stream_id.toString());
  }
  if (data.level_id !== undefined && data.level_id !== null) {
    formData.append('level_id', data.level_id.toString());
  }
  if (data.program_id !== undefined && data.program_id !== null) {
    formData.append('program_id', data.program_id.toString());
  }
  formData.append('title', data.title);
  if (data.summary) formData.append('summary', data.summary);
  if (data.duration) formData.append('duration', data.duration);
  if (data.curriculum_detail) formData.append('curriculum_detail', data.curriculum_detail);
  if (data.admission_process) formData.append('admission_process', data.admission_process);
  if (data.eligibility) formData.append('eligibility', data.eligibility);
  if (data.placements) formData.append('placements', data.placements);
  if (data.scholarship) formData.append('scholarship', data.scholarship);
  if (data.brochure_url) formData.append('brochure_url', data.brochure_url);
  if (data.fee_per_sem !== undefined && data.fee_per_sem !== null) {
    formData.append('fee_per_sem', data.fee_per_sem.toString());
  }
  if (data.total_fee !== undefined && data.total_fee !== null) {
    formData.append('total_fee', data.total_fee.toString());
  }
  if (data.subject_ids !== undefined && data.subject_ids !== null && data.subject_ids.length > 0) {
    formData.append('subject_ids', JSON.stringify(data.subject_ids));
  }
  if (data.exam_ids !== undefined && data.exam_ids !== null && data.exam_ids.length > 0) {
    formData.append('exam_ids', JSON.stringify(data.exam_ids));
  }
  if (data.brochure) {
    formData.append('brochure', data.brochure);
  }

  return apiRequest(API_ENDPOINTS.ADMIN.COLLEGE_COURSES, {
    method: 'POST',
    body: formData,
  });
}

/**
 * Update course
 */
export async function updateCollegeCourse(
  id: number,
  data: {
    college_id?: number;
    stream_id?: number | null;
    level_id?: number | null;
    program_id?: number | null;
    title?: string;
    summary?: string | null;
    duration?: string | null;
    curriculum_detail?: string | null;
    admission_process?: string | null;
    eligibility?: string | null;
    placements?: string | null;
    scholarship?: string | null;
    brochure_url?: string | null;
    fee_per_sem?: number | null;
    total_fee?: number | null;
    subject_ids?: number[] | null;
    exam_ids?: number[] | null;
    brochure?: File;
  }
): Promise<ApiResponse<{
  course: CollegeCourse;
}>> {
  const formData = new FormData();
  
  if (data.college_id !== undefined) {
    formData.append('college_id', data.college_id.toString());
  }
  if (data.stream_id !== undefined) {
    formData.append('stream_id', data.stream_id !== null ? data.stream_id.toString() : '');
  }
  if (data.level_id !== undefined) {
    formData.append('level_id', data.level_id !== null ? data.level_id.toString() : '');
  }
  if (data.program_id !== undefined) {
    formData.append('program_id', data.program_id !== null ? data.program_id.toString() : '');
  }
  if (data.title !== undefined) {
    formData.append('title', data.title);
  }
  if (data.summary !== undefined) {
    formData.append('summary', data.summary || '');
  }
  if (data.duration !== undefined) {
    formData.append('duration', data.duration || '');
  }
  if (data.curriculum_detail !== undefined) {
    formData.append('curriculum_detail', data.curriculum_detail || '');
  }
  if (data.admission_process !== undefined) {
    formData.append('admission_process', data.admission_process || '');
  }
  if (data.eligibility !== undefined) {
    formData.append('eligibility', data.eligibility || '');
  }
  if (data.placements !== undefined) {
    formData.append('placements', data.placements || '');
  }
  if (data.scholarship !== undefined) {
    formData.append('scholarship', data.scholarship || '');
  }
  if (data.brochure_url !== undefined) {
    formData.append('brochure_url', data.brochure_url || '');
  }
  if (data.fee_per_sem !== undefined) {
    formData.append('fee_per_sem', data.fee_per_sem !== null ? data.fee_per_sem.toString() : '');
  }
  if (data.total_fee !== undefined) {
    formData.append('total_fee', data.total_fee !== null ? data.total_fee.toString() : '');
  }
  if (data.subject_ids !== undefined) {
    formData.append('subject_ids', data.subject_ids !== null && data.subject_ids.length > 0 ? JSON.stringify(data.subject_ids) : '');
  }
  if (data.exam_ids !== undefined) {
    formData.append('exam_ids', data.exam_ids !== null && data.exam_ids.length > 0 ? JSON.stringify(data.exam_ids) : '');
  }
  if (data.brochure) {
    formData.append('brochure', data.brochure);
  }

  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_COURSES}/${id}`, {
    method: 'PUT',
    body: formData,
  });
}

/**
 * Delete course
 */
export async function deleteCollegeCourse(id: number): Promise<ApiResponse<null>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.COLLEGE_COURSES}/${id}`, {
    method: 'DELETE',
  });
}

