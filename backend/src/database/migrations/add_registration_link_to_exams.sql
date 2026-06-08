-- Add registration_link column to exams_taxonomies
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS registration_link VARCHAR(500);

COMMENT ON COLUMN exams_taxonomies.registration_link IS 'Official exam registration / application URL';
