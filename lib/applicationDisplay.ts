export type ApplicationRecordStatus =
  | "pending"
  | "approved"
  | "running"
  | "completed"
  | "failed";

export type ApplicationDisplayStatus = "In Process" | "Filled" | "Applied" | "Failed";

export type StudentApplication = {
  id: number;
  exam_id: number;
  exam_name: string;
  exam_slug: string;
  exam_url?: string | null;
  taxonomy_exam_id?: number | null;
  status: ApplicationRecordStatus;
  created_at: string;
  session_id?: string;
  source?: string;
  application_start_date?: string | null;
  application_close_date?: string | null;
  application_fees?: number | null;
  ut_service_fee?: number | null;
  missing_fields?: string[];
  display_status?: ApplicationDisplayStatus;
};

export function formatApplicationDate(value: string | null | undefined): string {
  if (!value) return "—";
  return String(value).slice(0, 10);
}

export function formatApplicationFee(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatUtServiceFee(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `${Number(value)} credits`;
}

export function getApplicationDisplayStatus(app: Pick<StudentApplication, "status" | "source">): ApplicationDisplayStatus {
  if (app.display_status) return app.display_status;
  if (app.status === "failed") return "Failed";
  if (app.status === "completed") {
    return app.source === "already_filled_form" ? "Filled" : "Applied";
  }
  return "In Process";
}

export function getApplicationMissingFields(
  app: Pick<
    StudentApplication,
    "application_start_date" | "application_close_date" | "application_fees" | "ut_service_fee" | "exam_url" | "missing_fields"
  >
): string[] {
  const feeLabels = new Set(["Form fee", "UT service fee"]);
  const raw = app.missing_fields?.length
    ? [...app.missing_fields]
    : (() => {
        const missing: string[] = [];
        if (!app.application_start_date) missing.push("Application start date");
        if (!app.application_close_date) missing.push("Application end date");
        if (app.application_fees == null) missing.push("Form fee");
        if (app.ut_service_fee == null) missing.push("UT service fee");
        if (!app.exam_url?.trim()) missing.push("Registration link");
        return missing;
      })();
  return raw.filter((label) => !feeLabels.has(label));
}

export function normalizeRegistrationUrl(url: string | null | undefined): string | null {
  const raw = url?.trim();
  if (!raw) return null;
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export function openRegistrationUrl(url: string | null | undefined) {
  const href = normalizeRegistrationUrl(url);
  if (!href) return false;
  window.open(href, "_blank", "noopener,noreferrer");
  return true;
}
