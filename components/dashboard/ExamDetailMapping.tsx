"use client";

import { ExamDetailLinkedColleges } from "@/components/dashboard/ExamDetailLinkedColleges";
import { ExamDetailLinkedScholarships } from "@/components/dashboard/ExamDetailLinkedScholarships";
import type { DashboardCollege } from "@/api/auth/profile";
import type { ExamLinkedScholarshipPreview } from "@/api/exams";

type ExamDetailMappingProps = {
  colleges: DashboardCollege[];
  linkedCollegesTotal: number;
  collegesLoading?: boolean;
  scholarships: ExamLinkedScholarshipPreview[];
  linkedScholarshipTotal: number;
};

export function ExamDetailMapping({
  colleges,
  linkedCollegesTotal,
  collegesLoading = false,
  scholarships,
  linkedScholarshipTotal,
}: ExamDetailMappingProps) {
  return (
    <article className="rounded-2xl bg-white p-5 dark:bg-slate-900">
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Mapping</h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Colleges and scholarships tagged to this exam in admin.
      </p>

      <div className="mt-5 space-y-6">
        <ExamDetailLinkedColleges
          colleges={colleges}
          totalCount={linkedCollegesTotal}
          isLoading={collegesLoading}
          embedded
        />
        <ExamDetailLinkedScholarships
          scholarships={scholarships}
          totalCount={linkedScholarshipTotal}
          embedded
        />
      </div>
    </article>
  );
}
