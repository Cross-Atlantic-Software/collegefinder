import { apiRequest } from "../client";
import { API_ENDPOINTS } from "../constants";
import type { ApiResponse } from "../types";
import type { LegalDocument } from "@/types/legalDocument";

export async function getAdminLegalDocument(): Promise<
  ApiResponse<{ document: LegalDocument }>
> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LEGAL_DOCUMENT}`, { method: "GET" });
}

export async function updateAdminLegalDocument(
  document: LegalDocument,
): Promise<ApiResponse<{ document: LegalDocument }>> {
  return apiRequest(`${API_ENDPOINTS.ADMIN.LEGAL_DOCUMENT}`, {
    method: "PUT",
    body: JSON.stringify({ document }),
  });
}
