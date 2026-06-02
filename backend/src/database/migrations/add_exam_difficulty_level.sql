-- Add difficulty_level to exams_taxonomies
ALTER TABLE exams_taxonomies
  ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50);

ALTER TABLE exams_taxonomies
  DROP CONSTRAINT IF EXISTS exams_taxonomies_difficulty_level_check;

ALTER TABLE exams_taxonomies
  ADD CONSTRAINT exams_taxonomies_difficulty_level_check
  CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('Advanced', 'Intermediate', 'Intermediate - advanced')
  );
