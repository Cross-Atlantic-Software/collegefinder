const EXAM_DIFFICULTY_LEVELS = Object.freeze([
  'Beginner',
  'Advanced',
  'Intermediate',
  'Intermediate - advanced',
]);

function normalizeExamDifficultyLevel(value) {
  if (value == null || String(value).trim() === '') return null;
  const trimmed = String(value).trim();
  const match = EXAM_DIFFICULTY_LEVELS.find(
    (level) => level.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? null;
}

function isValidExamDifficultyLevel(value) {
  if (value == null || String(value).trim() === '') return true;
  return normalizeExamDifficultyLevel(value) != null;
}

module.exports = {
  EXAM_DIFFICULTY_LEVELS,
  normalizeExamDifficultyLevel,
  isValidExamDifficultyLevel,
};
