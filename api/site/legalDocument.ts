import { apiRequest } from "../client";
import { API_ENDPOINTS } from "../constants";
import type { ApiResponse } from "../types";
import type { LegalDocument } from "@/types/legalDocument";

export async function getLegalPageDocument(): Promise<
  ApiResponse<{ document: LegalDocument }>
> {
  return apiRequest(`${API_ENDPOINTS.SITE.LEGAL_DOCUMENT}`, { method: "GET" });
}
