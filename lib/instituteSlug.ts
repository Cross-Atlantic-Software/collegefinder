/** Slug for `/dashboard/institutes/[instituteId]` routes. */
export function slugifyInstituteName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function instituteDetailHref(
  instituteName: string,
  from:
    | "dashboard-coaching-online"
    | "dashboard-coaching-offline"
    | "dashboard-coaching-shortlist"
    | string = "dashboard-coaching-online"
): string {
  return `/dashboard/institutes/${slugifyInstituteName(instituteName)}?from=${encodeURIComponent(from)}`;
}
