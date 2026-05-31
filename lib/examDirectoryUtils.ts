import type { Exam } from "@/api/exams";

export const EXAM_DIRECTORY_PREVIEW_COUNT = 5;

export function examsForStream(exams: Exam[], streamId: number): Exam[] {
  return exams
    .filter((exam) => exam.eligibilityCriteria?.stream_ids?.includes(streamId))
    .sort((a, b) => {
      const rankA = a.exam_popularity_rank ?? Number.MAX_SAFE_INTEGER;
      const rankB = b.exam_popularity_rank ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.name.localeCompare(b.name);
    });
}

export function splitExamsForPublicDirectory(exams: Exam[]): {
  visible: Exam[];
  lockedPreview: Exam | null;
  hasMoreLocked: boolean;
} {
  const visible = exams.slice(0, EXAM_DIRECTORY_PREVIEW_COUNT);
  const lockedPreview = exams[EXAM_DIRECTORY_PREVIEW_COUNT] ?? null;
  return {
    visible,
    lockedPreview,
    hasMoreLocked: exams.length > EXAM_DIRECTORY_PREVIEW_COUNT,
  };
}
