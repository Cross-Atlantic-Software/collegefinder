import type { DashboardInstituteDetail } from "@/api/auth/profile";
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

/** Card/list blurb from DB description or location fields only. */
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
  const t = type?.trim().toLowerCase();
  if (t === "online") return "Online";
  if (t === "offline") return "Offline";
  if (t === "hybrid") return "Hybrid";
  return type?.trim() || null;
}

function formatYesNo(value: boolean | null | undefined): string | null {
  if (value == null) return null;
  return value ? "Yes" : "No";
}

export function buildInstituteDetailSections(
  institute: DashboardInstituteDetail
): CollegeDetailSection[] {
  const overview: Array<{ label: string; value: string }> = [];
  pushItem(overview, "Institute key", institute.institute_cityname);
  pushItem(overview, "Location", instituteLocationLine(institute));
  pushItem(overview, "Delivery type", formatDeliveryType(institute.type));
  pushItem(overview, "Contact", institute.contact_number);
  pushItem(overview, "Branches", institute.branches_number);
  pushItem(overview, "Student strength", institute.student_strength);
  pushItem(overview, "Website", institute.website);
  pushItem(overview, "Google Maps", institute.google_maps_link);

  const details: Array<{ label: string; value: string }> = [];
  pushItem(details, "Description", institute.instituteDetails?.institute_description);
  pushItem(details, "Demo available", formatYesNo(institute.instituteDetails?.demo_available));
  pushItem(
    details,
    "Scholarship available",
    formatYesNo(institute.instituteDetails?.scholarship_available)
  );

  const stats: Array<{ label: string; value: string }> = [];
  pushItem(stats, "Ranking score", institute.statistics?.ranking_score);
  pushItem(stats, "Success rate", institute.statistics?.success_rate);
  pushItem(stats, "Student rating", institute.statistics?.student_rating);

  const sections: CollegeDetailSection[] = [];
  if (overview.some((i) => i.value)) {
    sections.push({ id: "overview", title: "Overview", items: overview });
  }
  if (details.some((i) => i.value)) {
    sections.push({ id: "details", title: "About", items: details });
  }
  if (stats.some((i) => i.value)) {
    sections.push({ id: "statistics", title: "Statistics", items: stats });
  }

  if (institute.courses?.length) {
    institute.courses.forEach((course, index) => {
      const items: Array<{ label: string; value: string }> = [];
      pushItem(items, "Course", course.course_name);
      pushItem(items, "Target class", course.target_class);
      pushItem(items, "Duration (months)", course.duration_months);
      pushItem(items, "Fees", course.fees);
      pushItem(items, "Batch size", course.batch_size);
      pushItem(items, "Start date", formatExamDate(course.start_date));
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
