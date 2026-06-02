import type { DashboardScholarship, DashboardScholarshipDetail } from "@/api/auth/profile";
import type { CollegeDetailSection } from "@/lib/collegeDisplay";
import { hasDisplayValue, formatExamDate } from "@/lib/examDisplay";

function pushItem(
  items: Array<{ label: string; value: string }>,
  label: string,
  value: unknown
) {
  if (!hasDisplayValue(value)) return;
  items.push({ label, value: String(value).trim() });
}

function formatYesNo(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "Yes" : "No";
}

/** Card/list blurb from DB description or type/authority only. */
export function scholarshipCardOverviewText(s: DashboardScholarship): string {
  const desc = s.description?.trim();
  if (desc) {
    return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  }
  return (
    s.scholarship_type?.trim() ||
    s.conducting_authority?.trim() ||
    "Scholarship opportunity aligned with your exams and colleges."
  );
}

export function scholarshipLinkedCollegeLocation(s: DashboardScholarship): string {
  const colleges = s.linkedColleges ?? [];
  const withPlace = colleges.find((c) => c.city?.trim() || c.state?.trim());
  if (!withPlace) return "";
  return [withPlace.city, withPlace.state].filter(Boolean).join(", ");
}

export function buildScholarshipDetailSections(
  scholarship: DashboardScholarshipDetail
): CollegeDetailSection[] {
  const overview: Array<{ label: string; value: string }> = [];
  pushItem(overview, "Conducting authority", scholarship.conducting_authority);
  pushItem(overview, "Scholarship type", scholarship.scholarship_type);
  pushItem(overview, "Stream", scholarship.stream_name);
  pushItem(overview, "Amount", scholarship.scholarship_amount);
  pushItem(overview, "Mode", scholarship.mode);
  pushItem(overview, "Academic year", scholarship.academic_year);
  pushItem(overview, "Education level", scholarship.education_level);
  pushItem(overview, "Scope", scholarship.scope);
  pushItem(overview, "Value category", scholarship.value_category);
  pushItem(overview, "Status", scholarship.active_status);
  pushItem(overview, "Income limit", scholarship.income_limit);
  pushItem(overview, "Minimum marks", scholarship.minimum_marks_required);
  pushItem(overview, "Eligible degree", scholarship.eligible_degree);
  pushItem(overview, "Number of awards", scholarship.number_of_awards);
  pushItem(overview, "Application opens", formatExamDate(scholarship.application_start_date));
  pushItem(overview, "Application closes", formatExamDate(scholarship.application_end_date));
  pushItem(overview, "Application link", scholarship.application_link);
  pushItem(overview, "Official notification", scholarship.official_notification_link);

  const about: Array<{ label: string; value: string }> = [];
  pushItem(about, "Description", scholarship.description);
  pushItem(about, "Selection process", scholarship.selection_process);
  pushItem(about, "Renewal available", formatYesNo(scholarship.renewal_available));
  pushItem(about, "Renewal conditions", scholarship.renewal_conditions);

  const eligibility: Array<{ label: string; value: string }> = [];
  if (scholarship.eligibleCategories?.length) {
    pushItem(
      eligibility,
      "Eligible categories",
      scholarship.eligibleCategories.map((r) => r.category).filter(Boolean).join(", ")
    );
  }
  if (scholarship.applicableStates?.length) {
    pushItem(
      eligibility,
      "Applicable states",
      scholarship.applicableStates.map((r) => r.state_name).filter(Boolean).join(", ")
    );
  }
  if (scholarship.documentsRequired?.length) {
    pushItem(
      eligibility,
      "Documents required",
      scholarship.documentsRequired.map((r) => r.document_name).filter(Boolean).join(", ")
    );
  }

  const sections: CollegeDetailSection[] = [];
  if (overview.some((i) => i.value)) {
    sections.push({ id: "overview", title: "Overview", items: overview });
  }
  if (about.some((i) => i.value)) {
    sections.push({ id: "about", title: "About", items: about });
  }
  if (eligibility.some((i) => i.value)) {
    sections.push({ id: "eligibility", title: "Eligibility", items: eligibility });
  }

  return sections;
}
