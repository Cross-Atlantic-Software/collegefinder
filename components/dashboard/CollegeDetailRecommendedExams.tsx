"use client";

import type { DashboardCollege } from "@/api/auth/profile";
import { DetailRecommendedExamsCTA } from "@/components/dashboard/DetailRecommendedExamsCTA";

type CollegeDetailRecommendedExamsProps = {
  college: DashboardCollege;
};

export function CollegeDetailRecommendedExams({ college }: CollegeDetailRecommendedExamsProps) {
  return (
    <DetailRecommendedExamsCTA
      linkedExams={college.linkedExams}
      linkFrom="dashboard-college-shortlist"
      subtitle="Linked to this college."
    />
  );
}
