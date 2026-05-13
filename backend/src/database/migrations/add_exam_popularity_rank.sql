-- Optional sort / feature flag: lower integer = more popular (convention); NULL = unset.
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_popularity_rank INTEGER;

COMMENT ON COLUMN exams_taxonomies.exam_popularity_rank IS 'Optional popularity order for sorting (e.g. 1 = most popular). NULL means unset.';

CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_exam_popularity_rank ON exams_taxonomies(exam_popularity_rank);
