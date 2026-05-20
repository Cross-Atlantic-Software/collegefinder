"use client";

import { resolveCollegeLogoSrc } from "@/lib/collegeLogo";
import type { DashboardCollege } from "@/api/auth/profile";

const LOCAL_COLLEGE_IMAGES = [
  "/college/image.png",
  "/college/image copy.png",
  "/college/image copy 2.png",
];

type CollegeLogoProps = {
  college: Pick<
    DashboardCollege,
    "id" | "college_name" | "college_logo" | "logo_url" | "logo_filename"
  >;
  className?: string;
  imageClassName?: string;
};

/** College logo on the right: object-contain, fallback icon if missing. */
export function CollegeLogo({ college, className = "", imageClassName = "" }: CollegeLogoProps) {
  const src =
    resolveCollegeLogoSrc(college) ??
    LOCAL_COLLEGE_IMAGES[Math.abs(college.id) % LOCAL_COLLEGE_IMAGES.length];

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 ${className}`}
    >
      <img
        src={src}
        alt={`${college.college_name} logo`}
        className={`max-h-full max-w-full object-contain object-center ${imageClassName}`}
        loading="lazy"
      />
    </div>
  );
}
