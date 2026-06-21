"use client";

import type { DashboardInstitute } from "@/api/auth/profile";

const PLACEHOLDER = "/college/image.png";

type InstituteLogoProps = {
  institute: Pick<DashboardInstitute, "id" | "institute_name" | "logo">;
  className?: string;
  imageClassName?: string;
};

/** Coaching logo on the right: object-contain, fallback icon if missing. */
export function InstituteLogo({
  institute,
  className = "",
  imageClassName = "",
}: InstituteLogoProps) {
  const src = institute.logo?.trim() || PLACEHOLDER;

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`}
    >
      <img
        src={src}
        alt={`${institute.institute_name} logo`}
        className={`max-h-full max-w-full object-contain object-center ${imageClassName}`}
        loading="lazy"
      />
    </div>
  );
}
