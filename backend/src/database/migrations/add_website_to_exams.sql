-- Add website column to exams_taxonomies
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS website VARCHAR(500);

COMMENT ON COLUMN exams_taxonomies.website IS 'Official website URL for the exam';
