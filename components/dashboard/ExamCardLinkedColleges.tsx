"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Exam } from "@/api/exams";
import { EXAM_CARD_CHIP_CLASS } from "@/components/dashboard/examCardChipStyles";
import { collegeDetailHref } from "@/lib/collegeSlug";
import { examCardLinkedColleges, examCardLinkedCollegeOverflowCount, linkedCollegeChipLabel } from "@/lib/examDisplay";

type ExamCardLinkedCollegesProps = {
  exam: Exam;
  /**
   * `inline` — "Colleges:" label + pills (ExamCardBody, same block as Mode/Duration).
   * `chips` — pills only (ExamShortlistCard, same row style as mode/duration chips).
   */
  variant?: "inline" | "chips";
  /** Parent card is a link — use button navigation to avoid nested anchors. */
  embedInLink?: boolean;
  /** Query param for college detail breadcrumbs. */
  linkFrom?: "exam-card" | "exam-shortlist";
};

function collegeChipClassName(): string {
  return `${EXAM_CARD_CHIP_CLASS} cursor-pointer transition-colors hover:bg-slate-200 dark:hover:bg-slate-700`;
}

function CollegeNameChip({
  college,
  href,
  embedInLink,
}: {
  college: { id: number; name: string; abbreviation?: string | null };
  href: string;
  embedInLink: boolean;
}) {
  const router = useRouter();
  const className = collegeChipClassName();
  const label = linkedCollegeChipLabel(college);
  const fullName = college.name;

  if (embedInLink) {
    return (
      <span
        role="link"
        tabIndex={0}
        className={className}
        title={fullName}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(href);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            router.push(href);
          }
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      className={className}
      title={fullName}
      onClick={(e) => e.stopPropagation()}
    >
      {label}
    </Link>
  );
}

/** Linked colleges on exam cards (max 3), each opens college detail. */
export function ExamCardLinkedColleges({
  exam,
  variant = "inline",
  embedInLink = false,
  linkFrom = "exam-card",
}: ExamCardLinkedCollegesProps) {
  const colleges = examCardLinkedColleges(exam);
  if (!colleges.length) return null;
  const overflowCount = examCardLinkedCollegeOverflowCount(exam);

  const pills = colleges.map((college) => (
    <CollegeNameChip
      key={`${college.id}-${college.name}`}
      college={college}
      href={collegeDetailHref(college.name, linkFrom)}
      embedInLink={embedInLink}
    />
  ));

  if (variant === "chips") {
    return (
      <div className="flex flex-wrap gap-1">
        {pills}
        {overflowCount > 0 ? (
          <span
            className={`${EXAM_CARD_CHIP_CLASS} cursor-default`}
            title={`${overflowCount} more colleges`}
          >
            +{overflowCount}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <p className="m-0 flex flex-wrap items-center gap-1">
      <span className="font-medium text-slate-800 dark:text-slate-200">Colleges: </span>
      {pills}
      {overflowCount > 0 ? (
        <span
          className={`${EXAM_CARD_CHIP_CLASS} cursor-default`}
          title={`${overflowCount} more colleges`}
        >
          +{overflowCount}
        </span>
      ) : null}
    </p>
  );
}
