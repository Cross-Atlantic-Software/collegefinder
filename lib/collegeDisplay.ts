import type { DashboardCollege } from "@/api/auth/profile";

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

export function slugifyCollegeName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function collegeLogoSrc(college: Pick<DashboardCollege, "id" | "college_logo" | "logo_url">): string {
  const url = college.college_logo?.trim() || college.logo_url?.trim();
  if (url) return url;
  return LOCAL_COLLEGE_IMAGES[Math.abs(college.id) % LOCAL_COLLEGE_IMAGES.length];
}

export function collegeLocationLine(
  college: Pick<DashboardCollege, "city" | "state" | "college_location">
): string {
  const loc = [college.city, college.state].filter(Boolean).join(", ");
  return loc || college.college_location?.trim() || "";
}

export function collegeDetailHref(
  college: Pick<DashboardCollege, "college_name">,
  from: string
): string {
  return `/dashboard/colleges/${slugifyCollegeName(college.college_name)}?from=${from}`;
}
