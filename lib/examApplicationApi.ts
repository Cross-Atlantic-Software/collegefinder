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
