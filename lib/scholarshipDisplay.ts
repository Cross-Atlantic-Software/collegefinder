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
  const sections: CollegeDetailSection[] = [];

  // 1. Scholarship Information
  const info: Array<{ label: string; value: string }> = [];
  pushItem(info, "Scholarship ID", scholarship.id);
  pushItem(info, "Scholarship Name", scholarship.scholarship_name);
  pushItem(info, "Scholarship Type", scholarship.scholarship_type);
  pushItem(info, "About / Description", scholarship.description);
  pushItem(info, "Scholarship Provider", scholarship.conducting_authority);
  pushItem(info, "Coverage Scope", scholarship.scope);
  sections.push({ id: "overview", title: "Scholarship Information", items: info });

  // 2. Eligibility Criteria
  const eligibility: Array<{ label: string; value: string }> = [];
  if (scholarship.applicableStates?.length) {
    pushItem(
      eligibility,
      "State Eligibility",
      scholarship.applicableStates.map((r) => r.state_name).filter(Boolean).join(", ")
    );
  }
  pushItem(eligibility, "Education Level", scholarship.education_level);
  pushItem(eligibility, "Stream", scholarship.stream_name);
  if (scholarship.eligibleCategories?.length) {
    pushItem(
      eligibility,
      "Reservation Category",
      scholarship.eligibleCategories.map((r) => r.category).filter(Boolean).join(", ")
    );
  }
  pushItem(eligibility, "Family Income Limit", scholarship.income_limit);
  pushItem(
    eligibility,
    "Minimum Academic Percentage / CGPA",
    scholarship.minimum_marks_required
  );
  sections.push({ id: "eligibility", title: "Eligibility Criteria", items: eligibility });

  // 3. Scholarship Benefits
  const benefits: Array<{ label: string; value: string }> = [];
  pushItem(benefits, "Scholarship Amount", scholarship.scholarship_amount);
  pushItem(benefits, "Number of Awards", scholarship.number_of_awards);
  sections.push({ id: "benefits", title: "Scholarship Benefits", items: benefits });

  // 4. Renewal Details
  const renewal: Array<{ label: string; value: string }> = [];
  pushItem(renewal, "Renewal Available", formatYesNo(scholarship.renewal_available));
  pushItem(renewal, "Renewal Conditions", scholarship.renewal_conditions);
  sections.push({ id: "renewal", title: "Renewal Details", items: renewal });

  // 5. Application Details
  const application: Array<{ label: string; value: string }> = [];
  pushItem(application, "Application Start Date", formatExamDate(scholarship.application_start_date));
  pushItem(application, "Application End Date", formatExamDate(scholarship.application_end_date));
  pushItem(application, "Application Mode", scholarship.mode);
  if (scholarship.documentsRequired?.length) {
    pushItem(
      application,
      "Documents Required",
      scholarship.documentsRequired.map((r) => r.document_name).filter(Boolean).join(", ")
    );
  }
  sections.push({ id: "application", title: "Application Details", items: application });

  // 6. Selection Process
  const selection: Array<{ label: string; value: string }> = [];
  pushItem(selection, "Selection Process", scholarship.selection_process);
  sections.push({ id: "selection", title: "Selection Process", items: selection });

  // 7. Tracking & Links
  const tracking: Array<{ label: string; value: string }> = [];
  pushItem(tracking, "Scholarship Status", scholarship.active_status);
  pushItem(tracking, "Official Website", scholarship.official_website);
  pushItem(tracking, "Application Link", scholarship.application_link);
  sections.push({ id: "tracking", title: "Tracking & Links", items: tracking });

  // 8. Mapping
  const mapping: Array<{ label: string; value: string }> = [];
  if (scholarship.linkedColleges?.length) {
    pushItem(
      mapping,
      "Colleges",
      scholarship.linkedColleges.map((c) => c.name).filter(Boolean).join(", ")
    );
  }
  sections.push({ id: "mappings", title: "Mapping", items: mapping });

  return sections;
}
