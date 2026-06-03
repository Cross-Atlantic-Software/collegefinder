"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { directoryCardBgClass } from "@/components/containers/exam-directory/directoryCardTones";
import { LockedDirectoryPreviewCard } from "@/components/containers/directory/LockedDirectoryPreviewCard";
import { PublicCollegeCard } from "./PublicCollegeCard";

export type LockedCollegePreviewCardProps = {
  college: DashboardCollege | null;
  loginHref?: string;
  toneIndex?: number;
};

export function LockedCollegePreviewCard({
  college,
  loginHref = "/login?redirect=/college-directory",
  toneIndex = 0,
}: LockedCollegePreviewCardProps) {
  return (
    <LockedDirectoryPreviewCard
      preview={
        college ? <PublicCollegeCard college={college} toneIndex={toneIndex} /> : null
      }
      fallbackBgClass={directoryCardBgClass(toneIndex)}
      loginHref={loginHref}
      title="Showing top colleges."
      subtitle="Explore the full directory for 1000+ more."
      ctaLabel="Explore Colleges"
    />
  );
}
