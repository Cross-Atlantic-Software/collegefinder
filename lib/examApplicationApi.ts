import { getApiBaseUrl } from "@/api/client";
import type { StudentApplication } from "@/lib/applicationDisplay";

export const APPLICATIONS_NOTICE_KEY = "applications_notice";

export type AddExamApplicationResult = {
  ok: boolean;
  status: number;
  message: string;
  data?: StudentApplication;
  created: boolean;
};

export async function addExamToApplications(
  taxonomyExamId: number
): Promise<AddExamApplicationResult> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${getApiBaseUrl()}/user/automation-applications`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ taxonomy_exam_id: taxonomyExamId }),
  } as RequestInit);

  const data = await response.json().catch(() => ({}));

  return {
    ok: response.ok,
    status: response.status,
    message:
      data.message ||
      (response.ok ? "Exam added to My Applications." : "Could not add exam to My Applications."),
    data: data.data,
    created: response.status === 201,
  };
}

export type ExamExtraField = {
  field_path: string;
  label: string;
  type: string;
};

/**
 * Approved discovered.* fields this exam's adapter needs that the student
 * hasn't filled yet. Best-effort: returns [] on any error so Apply is never
 * blocked by this lookup.
 */
export async function getExamExtraFields(
  taxonomyExamId: number
): Promise<ExamExtraField[]> {
  try {
    const token = localStorage.getItem("auth_token");
    const response = await fetch(
      `${getApiBaseUrl()}/user/exam-extra-fields/${taxonomyExamId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      } as RequestInit
    );
    const data = await response.json().catch(() => ({}));
    return response.ok && Array.isArray(data.data) ? (data.data as ExamExtraField[]) : [];
  } catch {
    return [];
  }
}

/** Save student-entered values for approved discovered.* fields. */
export async function saveProfileFieldValues(
  values: Record<string, string>
): Promise<boolean> {
  const token = localStorage.getItem("auth_token");
  const response = await fetch(`${getApiBaseUrl()}/user/profile-field-values`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values }),
  } as RequestInit);
  return response.ok;
}
