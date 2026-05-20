/** Slug for `/dashboard/colleges/[collegeId]` routes (matches college detail page). */
export function slugifyCollegeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function collegeDetailHref(
  collegeName: string,
  from: "exam-card" | "exam-detail" | "exam-shortlist" = "exam-card"
): string {
  return `/dashboard/colleges/${slugifyCollegeName(collegeName)}?from=${from}`;
}
