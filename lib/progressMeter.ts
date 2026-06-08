/** Dot color for progress meter levels based on completion percentage. */
export function getProgressMeterDotColor(percent: number): string {
  const value = Math.max(0, Math.min(100, Math.round(percent)));

  if (value >= 100) return "#22c55e";
  if (value >= 90) return "#86efac";
  if (value >= 80) return "#f97316";
  if (value >= 70) return "#eab308";
  if (value >= 50) return "#ec4899";
  return "#ef4444";
}

export type ProgressMeterStep = {
  id: string;
  title: string;
  description: string;
  percent: number;
  isLoading?: boolean;
  /** When set, overrides the default threshold-based dot color. */
  dotColor?: string;
};

/** Map shortlisted exam count to progress meter percentage. */
export function getExamShortlistProgressPercent(shortlistedCount: number): number {
  const count = Math.max(0, Math.floor(shortlistedCount));

  if (count >= 10) return 100;
  if (count >= 8) return 85;
  if (count >= 5) return 70;
  if (count >= 3) return 60;
  if (count === 0) return 0;

  return Math.round((count / 3) * 60);
}

/** Map shortlisted college count to progress meter percentage. */
export function getCollegeDiscoveryProgressPercent(shortlistedCount: number): number {
  const count = Math.max(0, Math.floor(shortlistedCount));

  if (count >= 20) return 100;
  if (count >= 10) return 75;
  if (count >= 5) return 50;
  if (count === 0) return 0;

  return Math.round((count / 5) * 50);
}

/** Map shortlisted scholarship count to progress meter percentage. */
export function getScholarshipTrackerProgressPercent(shortlistedCount: number): number {
  const count = Math.max(0, Math.floor(shortlistedCount));

  if (count >= 3) return 100;
  if (count === 2) return 75;
  if (count === 1) return 50;
  return 0;
}

/** Map shortlisted coaching institute count to progress meter percentage. */
export function getCoachingShortlistProgressPercent(shortlistedCount: number): number {
  return getCollegeDiscoveryProgressPercent(shortlistedCount);
}

/** Application ready: % of shortlisted exams with completed automation_applications forms. */
export function getApplicationReadyProgressPercent(
  shortlistedExamIds: number[],
  automationFilledExamIds: number[],
): { percent: number; filledCount: number; totalCount: number } {
  const shortlisted = new Set(
    shortlistedExamIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
  );
  const totalCount = shortlisted.size;
  if (totalCount === 0) {
    return { percent: 0, filledCount: 0, totalCount: 0 };
  }

  const filledSet = new Set(
    automationFilledExamIds.map(Number).filter((id) => Number.isInteger(id) && id > 0),
  );
  let filledCount = 0;
  for (const examId of shortlisted) {
    if (filledSet.has(examId)) {
      filledCount += 1;
    }
  }

  return {
    percent: Math.round((filledCount / totalCount) * 100),
    filledCount,
    totalCount,
  };
}

/** Mock tests completed in the current week. */
export function getWeeklyMockTestsProgressPercent(completedCount: number): number {
  const count = Math.max(0, Math.floor(completedCount));

  if (count >= 3) return 100;
  if (count === 2) return 85;
  if (count === 1) return 70;
  return 0;
}

/** Performance insights: green at 100%, orange otherwise. */
export function getPerformanceInsightsDotColor(percent: number): string {
  return percent >= 100 ? "#22c55e" : "#f97316";
}

/** Rank predictor: green when improving or baseline, orange when rank declined. */
export function getRankPredictorDotColor(isImproving: boolean): string {
  return isImproving ? "#22c55e" : "#f97316";
}

export function getRankPredictorProgressPercent(isImproving: boolean): number {
  return isImproving ? 100 : 0;
}

/** Counselling ready: green at 100%, orange otherwise. */
export function getCounsellingReadyDotColor(percent: number): string {
  return percent >= 100 ? "#22c55e" : "#f97316";
}

/** Aptitude mapping: green when paid, red when not paid. */
export function getAptitudeMappingProgressPercent(isPaid: boolean): number {
  return isPaid ? 100 : 0;
}

export function getAptitudeMappingDotColor(isPaid: boolean): string {
  return isPaid ? "#22c55e" : "#ef4444";
}

/** Goal selection: green when strengths exist, red otherwise. */
export function getGoalSelectionProgressPercent(hasStrengths: boolean): number {
  return hasStrengths ? 100 : 0;
}

export function getGoalSelectionDotColor(hasStrengths: boolean): string {
  return hasStrengths ? "#22c55e" : "#ef4444";
}
