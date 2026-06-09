export const EXAM_DIFFICULTY_LEVELS = [
  "Beginner",
  "Advanced",
  "Intermediate",
  "Intermediate - advanced",
] as const;

export type ExamDifficultyLevel = (typeof EXAM_DIFFICULTY_LEVELS)[number];

export const EXAM_DIFFICULTY_LEVEL_OPTIONS = EXAM_DIFFICULTY_LEVELS.map((value) => ({
  value,
  label: value,
}));
