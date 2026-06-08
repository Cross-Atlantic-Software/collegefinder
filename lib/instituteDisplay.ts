import type { DashboardInstituteDetail, DashboardInstituteStatistics } from "@/api/auth/profile";
import type { CollegeDetailSection } from "@/lib/collegeDisplay";
import { hasDisplayValue, formatExamDate } from "@/lib/examDisplay";

export function instituteLocationLine(
  inst: Pick<
    DashboardInstituteDetail,
    "city" | "state" | "institute_location" | "institute_cityname"
  >
): string | null {
  const cityState = [inst.city, inst.state].filter(Boolean).join(", ");
  if (cityState) return cityState;
  return inst.institute_location?.trim() || inst.institute_cityname?.trim() || null;
}

export function isInstituteOnlineMode(type: string | null | undefined): boolean {
  return type?.trim().toLowerCase() === "online";
}

export function instituteModeLabel(type: string | null | undefined): string | null {
  const t = type?.trim().toLowerCase();
  if (t === "online") return "Online";
  if (t === "offline") return "Offline";
  if (t === "hybrid") return "Hybrid";
  return type?.trim() || null;
}

function instituteDescriptionText(institute: DashboardInstituteDetail): string | null {
  const fromDetails = institute.instituteDetails?.institute_description?.trim();
  if (fromDetails) return fromDetails;
  return institute.institute_description?.trim() || null;
}

/** Card/list blurb from DB description or location fields only. */
/** Stats line for exam-detail linked coaching cards. */
export function instituteExamDetailStatsLine(
  inst: Pick<
    DashboardInstituteDetail,
    "fee_type" | "fee_band" | "batch_category" | "course_cycle" | "parent_institute"
  >
): string | null {
  const parts = [
    inst.fee_type?.trim(),
    inst.fee_band?.trim(),
    inst.batch_category?.trim(),
    inst.course_cycle?.trim(),
    inst.parent_institute?.trim(),
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : null;
}

export function instituteCardOverviewText(
  inst: Pick<
    DashboardInstituteDetail,
    | "institute_description"
    | "city"
    | "state"
    | "institute_location"
    | "institute_cityname"
  >
): string {
  const desc = inst.institute_description?.trim();
  if (desc) {
    return desc.length > 220 ? `${desc.slice(0, 217)}…` : desc;
  }
  const loc = instituteLocationLine(inst);
  if (loc) return loc;
  return "Explore courses and contact details for this coaching institute.";
}

function pushItem(
  items: Array<{ label: string; value: string }>,
  label: string,
  value: unknown
) {
  if (!hasDisplayValue(value)) return;
  items.push({ label, value: String(value).trim() });
}

function formatDeliveryType(type: string | null | undefined): string | null {
  return instituteModeLabel(type);
}

function formatInstituteMetric(value: string | number | null | undefined): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

export function instituteCardRankingDisplay(
  value: string | number | null | undefined
): string | null {
  return formatInstituteMetric(value);
}

export function instituteCardSuccessRateDisplay(
  value: string | number | null | undefined
): string | null {
  const text = formatInstituteMetric(value);
  if (!text) return null;
  return text.endsWith("%") ? text : `${text}%`;
}

export function instituteCardStudentRatingDisplay(
  value: string | number | null | undefined
): string | null {
  return formatInstituteMetric(value);
}

export function instituteCardStatisticsFields(
  statistics: Pick<
    DashboardInstituteStatistics,
    "ranking_score" | "success_rate" | "student_rating"
  > | null | undefined
): Array<{ label: string; value: string }> {
  const fields: Array<{ label: string; value: string }> = [];
  const ranking = instituteCardRankingDisplay(statistics?.ranking_score);
  const successRate = instituteCardSuccessRateDisplay(statistics?.success_rate);
  const studentRating = instituteCardStudentRatingDisplay(statistics?.student_rating);

  if (ranking) fields.push({ label: "Ranking", value: ranking });
  if (successRate) fields.push({ label: "Success Rate", value: successRate });
  if (studentRating) fields.push({ label: "Student Rating", value: studentRating });

  return fields;
}

function formatYesNo(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "Yes" : "No";
}

export function buildInstituteDetailSections(
  institute: DashboardInstituteDetail
): CollegeDetailSection[] {
  const isOnline = isInstituteOnlineMode(institute.type);
  const overview: Array<{ label: string; value: string }> = [];

  const description = instituteDescriptionText(institute);
  if (description) pushItem(overview, "Description", description);

  pushItem(overview, "Institute Name", institute.institute_name);
  if (!isOnline) pushItem(overview, "Location", instituteLocationLine(institute));
  pushItem(overview, "Mode", formatDeliveryType(institute.type));
  pushItem(overview, "Contact", institute.contact_number);
  pushItem(overview, "Branches", institute.branches_number);
  pushItem(overview, "Student Strength", institute.student_strength);
  pushItem(overview, "Fee type", institute.fee_type);
  pushItem(overview, "Fee band", institute.fee_band);
  pushItem(overview, "Batch category", institute.batch_category);
  pushItem(overview, "Course cycle", institute.course_cycle);
  pushItem(overview, "Parent institute", institute.parent_institute);
  pushItem(overview, "Demo Available", formatYesNo(institute.instituteDetails?.demo_available));
  pushItem(
    overview,
    "Scholarship Available",
    formatYesNo(institute.instituteDetails?.scholarship_available)
  );

  const stats: Array<{ label: string; value: string }> = [];
  pushItem(stats, "Ranking", institute.statistics?.ranking_score);
  pushItem(stats, "Success Rate", institute.statistics?.success_rate);
  pushItem(stats, "Student Rating", institute.statistics?.student_rating);

  const sections: CollegeDetailSection[] = [];
  if (overview.some((i) => i.value)) {
    sections.push({ id: "overview", title: "Overview", items: overview });
  }
  if (stats.some((i) => i.value)) {
    sections.push({ id: "statistics", title: "Statistics", items: stats });
  }

  if (institute.courses?.length) {
    institute.courses.forEach((course, index) => {
      const items: Array<{ label: string; value: string }> = [];
      pushItem(items, "Course", course.course_name);
      pushItem(items, "Target Class", course.target_class);
      pushItem(items, "Duration (Months)", course.duration_months);
      pushItem(items, "Fees", course.fees);
      pushItem(items, "Batch Size", course.batch_size);
      pushItem(items, "Start Date", formatExamDate(course.start_date));
      if (items.length) {
        sections.push({
          id: `course-${course.id ?? index}`,
          title: course.course_name?.trim() || `Course ${index + 1}`,
          items,
        });
      }
    });
  }

  return sections;
}
