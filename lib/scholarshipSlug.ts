/** Slug for `/dashboard/scholarships/[scholarshipId]` routes. */
export function slugifyScholarshipName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function scholarshipDetailHref(
  scholarshipName: string,
  from:
    | "dashboard-scholarship-recommended"
    | "dashboard-scholarship-shortlisted"
    | "dashboard-scholarship-all"
    | string = "dashboard-scholarship-recommended"
): string {
  return `/dashboard/scholarships/${slugifyScholarshipName(scholarshipName)}?from=${encodeURIComponent(from)}`;
}
