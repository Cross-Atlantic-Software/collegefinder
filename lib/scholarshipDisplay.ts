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

/** Card/list blurb from DB description only (type/mode shown separately on the card). */
export function scholarshipCardOverviewText(s: DashboardScholarship): string {
  const desc = s.description?.trim();
  if (desc) {
    return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  }
  return "Scholarship opportunity aligned with your exams and colleges.";
}

function formatApplicableStatesDisplay(
  states: DashboardScholarship["applicableStates"]
): { value: string; tooltipValue: string } | null {
  const names = (states ?? []).map((r) => r.state_name?.trim()).filter(Boolean) as string[];
  if (!names.length) return null;
  const full = names.join(", ");
  const value = full.length > 48 ? `${full.slice(0, 45)}…` : full;
  return { value, tooltipValue: full };
}

export function scholarshipCardMetaFields(
  scholarship: DashboardScholarship,
  options: { showScholarshipType?: boolean } = {}
): Array<{ label: string; value: string; tooltipValue?: string }> {
  const fields: Array<{ label: string; value: string; tooltipValue?: string }> = [];
  const showScholarshipType = options.showScholarshipType ?? true;
  const scholarshipType = scholarship.scholarship_type?.trim();
  const amount = scholarship.scholarship_amount?.trim();
  const incomeLimit = scholarship.income_limit?.trim();
  const minimumMarks = scholarship.minimum_marks_required?.trim();
  const renewal = formatYesNo(scholarship.renewal_available);
  const states = formatApplicableStatesDisplay(scholarship.applicableStates);
  const streamName = scholarship.stream_name?.trim();
  const collegeLocation = scholarshipLinkedCollegeLocation(scholarship);

  if (showScholarshipType && scholarshipType) {
    fields.push({ label: "Scholarship Type", value: scholarshipType });
  }
  if (amount) fields.push({ label: "Amount", value: amount });
  if (incomeLimit) fields.push({ label: "Income Limit", value: incomeLimit });
  if (minimumMarks) fields.push({ label: "Minimum Marks", value: minimumMarks });
  if (renewal) fields.push({ label: "Renewal Available", value: renewal });
  if (states) {
    fields.push({
      label: "Applicable States",
      value: states.value,
      tooltipValue: states.tooltipValue,
    });
  }
  if (streamName) fields.push({ label: "Stream", value: streamName });
  if (collegeLocation) {
    fields.push({ label: "Linked College Location", value: collegeLocation });
  }

  return fields;
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
  pushItem(overview, "Description", scholarship.description);
  pushItem(overview, "Conducting Authority", scholarship.conducting_authority);
  pushItem(overview, "Scholarship Type", scholarship.scholarship_type);
  pushItem(overview, "Stream", scholarship.stream_name);
  pushItem(overview, "Amount", scholarship.scholarship_amount);
  pushItem(overview, "Mode", scholarship.mode);
  pushItem(overview, "Academic Year", scholarship.academic_year);
  pushItem(overview, "Education Level", scholarship.education_level);
  pushItem(overview, "Scope", scholarship.scope);
  pushItem(overview, "Value Category", scholarship.value_category);
  pushItem(overview, "Status", scholarship.active_status);
  pushItem(overview, "Income Limit", scholarship.income_limit);
  pushItem(overview, "Minimum Marks", scholarship.minimum_marks_required);
  pushItem(overview, "Eligible Degree", scholarship.eligible_degree);
  pushItem(overview, "Number of Awards", scholarship.number_of_awards);
  pushItem(overview, "Application Opens", formatExamDate(scholarship.application_start_date));
  pushItem(overview, "Application Closes", formatExamDate(scholarship.application_end_date));
  if (scholarship.documentsRequired?.length) {
    pushItem(
      overview,
      "Required Documents",
      scholarship.documentsRequired.map((r) => r.document_name).filter(Boolean).join(", ")
    );
  }

  const about: Array<{ label: string; value: string }> = [];
  pushItem(about, "Selection Process", scholarship.selection_process);
  pushItem(about, "Renewal Available", formatYesNo(scholarship.renewal_available));
  pushItem(about, "Renewal Conditions", scholarship.renewal_conditions);

  const eligibility: Array<{ label: string; value: string }> = [];
  if (scholarship.eligibleCategories?.length) {
    pushItem(
      eligibility,
      "Eligible Categories",
      scholarship.eligibleCategories.map((r) => r.category).filter(Boolean).join(", ")
    );
  }
  if (scholarship.applicableStates?.length) {
    pushItem(
      eligibility,
      "Applicable States",
      scholarship.applicableStates.map((r) => r.state_name).filter(Boolean).join(", ")
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
