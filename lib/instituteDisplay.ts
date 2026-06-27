import type {
  DashboardInstituteCourse,
  DashboardInstituteDetail,
  DashboardInstituteStatistics,
} from "@/api/auth/profile";
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

/** Distinct, non-empty values across an institute's courses, joined for a single key-value row. */
function distinctCourseValues(
  courses: DashboardInstituteCourse[] | undefined,
  pick: (c: DashboardInstituteCourse) => string | null | undefined
): string | null {
  if (!courses?.length) return null;
  const vals = Array.from(
    new Set(
      courses
        .map((c) => {
          const v = pick(c);
          return v == null ? null : String(v).trim();
        })
        .filter((v): v is string => Boolean(v))
    )
  );
  return vals.length ? vals.join(", ") : null;
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
  const sections: CollegeDetailSection[] = [];
  const courses = institute.courses;

  // 1. Institute Information
  const info: Array<{ label: string; value: string }> = [];
  pushItem(info, "Institute Name", institute.institute_name);
  pushItem(info, "Parent Institute", institute.parent_institute);
  pushItem(info, "Description", instituteDescriptionText(institute));
  sections.push({ id: "overview", title: "Institute Information", items: info });

  // 2. Location Details
  const location: Array<{ label: string; value: string }> = [];
  pushItem(location, "City", institute.city);
  pushItem(location, "Institute Location", institute.institute_location);
  pushItem(location, "State", institute.state);
  pushItem(location, "Number of Branches", institute.branches_number);
  sections.push({ id: "location", title: "Location Details", items: location });

  // 3. Program Details (Target Class / Duration / Start Date are course-level; Course Cycle is institute-level)
  const program: Array<{ label: string; value: string }> = [];
  pushItem(program, "Target Class", distinctCourseValues(courses, (c) => c.target_class));
  pushItem(program, "Duration (Months)", distinctCourseValues(courses, (c) => c.duration_months));
  pushItem(program, "Course Cycle", institute.course_cycle);
  pushItem(program, "Start Date", distinctCourseValues(courses, (c) => formatExamDate(c.start_date)));
  sections.push({ id: "program", title: "Program Details", items: program });

  // 4. Learning & Delivery
  const learning: Array<{ label: string; value: string }> = [];
  pushItem(learning, "Mode", instituteModeLabel(institute.type));
  pushItem(learning, "Batch Size", distinctCourseValues(courses, (c) => c.batch_size));
  pushItem(learning, "Batch Category", institute.batch_category);
  pushItem(learning, "Demo Available", formatYesNo(institute.instituteDetails?.demo_available));
  sections.push({ id: "learning", title: "Learning & Delivery", items: learning });

  // 5. Fee & Scholarship
  const fee: Array<{ label: string; value: string }> = [];
  pushItem(fee, "Fees", distinctCourseValues(courses, (c) => c.fees));
  pushItem(fee, "Fee Type", institute.fee_type);
  pushItem(fee, "Fee Band", institute.fee_band);
  pushItem(
    fee,
    "Scholarship Available",
    formatYesNo(institute.instituteDetails?.scholarship_available)
  );
  sections.push({ id: "fees", title: "Fee & Scholarship", items: fee });

  // 6. Performance & Reputation
  const performance: Array<{ label: string; value: string }> = [];
  pushItem(performance, "Ranking Score", institute.statistics?.ranking_score);
  pushItem(
    performance,
    "Institute Success Potential (%)",
    instituteCardSuccessRateDisplay(institute.statistics?.success_rate)
  );
  const rating = formatInstituteMetric(institute.statistics?.student_rating);
  if (rating) pushItem(performance, "Student Rating", `${rating} / 5`);
  pushItem(performance, "Student Strength", institute.student_strength);
  sections.push({ id: "statistics", title: "Performance & Reputation", items: performance });

  return sections;
}
