"use client";

import { MdSchool } from "react-icons/md";
import type { DashboardScholarship } from "@/api/auth/profile";

type ScholarshipLogoProps = {
  scholarship: Pick<DashboardScholarship, "scholarship_name">;
  className?: string;
};

/** Scholarship badge on the right (no logo field in schema — icon fallback). */
export function ScholarshipLogo({ scholarship, className = "" }: ScholarshipLogoProps) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-800 ${className}`}
      aria-hidden
    >
      <MdSchool
        className="h-8 w-8 text-slate-300 dark:text-slate-600"
        title={scholarship.scholarship_name}
      />
    </div>
  );
}
