/** Slug for `/dashboard/colleges/[collegeId]` routes (matches college detail page). */
export function slugifyCollegeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export type CollegeDetailFrom =
  | "exam-card"
  | "exam-detail"
  | "exam-shortlist"
  | "dashboard-college-shortlist-recommended"
  | "dashboard-college-shortlist-shortlisted"
  | "dashboard-college-shortlist-all"
  | "dashboard-scholarship-shortlist"
  | "dashboard-scholarship-recommended"
  | "dashboard-scholarship-shortlisted"
  | "dashboard-scholarship-all";

export function collegeDetailHref(
  collegeName: string,
  from: CollegeDetailFrom = "exam-card"
): string {
  return `/dashboard/colleges/${slugifyCollegeName(collegeName)}?from=${encodeURIComponent(from)}`;
}
