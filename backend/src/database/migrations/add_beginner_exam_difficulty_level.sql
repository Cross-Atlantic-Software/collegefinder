-- Add Beginner to exams_taxonomies difficulty_level check constraint
ALTER TABLE exams_taxonomies
  DROP CONSTRAINT IF EXISTS exams_taxonomies_difficulty_level_check;

ALTER TABLE exams_taxonomies
  ADD CONSTRAINT exams_taxonomies_difficulty_level_check
  CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('Beginner', 'Advanced', 'Intermediate', 'Intermediate - advanced')
  );
