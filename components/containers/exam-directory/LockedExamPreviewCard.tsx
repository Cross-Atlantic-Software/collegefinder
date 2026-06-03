"use client";

import type { Exam } from "@/api/exams";
import { LockedDirectoryPreviewCard } from "@/components/containers/directory/LockedDirectoryPreviewCard";
import { directoryCardBgClass } from "./directoryCardTones";
import { PublicExamCard } from "./PublicExamCard";

export type LockedExamPreviewCardProps = {
  exam: Exam | null;
  loginHref?: string;
  toneIndex?: number;
};

export function LockedExamPreviewCard({
  exam,
  loginHref = "/login?redirect=/exam-directory",
  toneIndex = 0,
}: LockedExamPreviewCardProps) {
  return (
    <LockedDirectoryPreviewCard
      preview={exam ? <PublicExamCard exam={exam} name={exam.name} toneIndex={toneIndex} /> : null}
      fallbackBgClass={directoryCardBgClass(toneIndex)}
      loginHref={loginHref}
      title="Showing top exams."
      subtitle="Explore the full directory for 1000+ more."
      ctaLabel="Browse all exams"
    />
  );
}
