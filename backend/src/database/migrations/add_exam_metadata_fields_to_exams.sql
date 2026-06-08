-- Additional exam metadata on exams_taxonomies
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(100);
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_frequency TEXT;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_pattern TEXT;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS avg_applicant_2023 INTEGER;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS avg_applicant_2024 INTEGER;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS avg_applicant_2025 INTEGER;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS avg_applicant_prev_three INTEGER;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS eligibility TEXT;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS qualified_candidate INTEGER;
ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS success_rate TEXT;

COMMENT ON COLUMN exams_taxonomies.abbreviation IS 'Short exam abbreviation (e.g. JEE, NEET)';
COMMENT ON COLUMN exams_taxonomies.category IS 'Exam category label';
COMMENT ON COLUMN exams_taxonomies.exam_frequency IS 'How often the exam is conducted';
COMMENT ON COLUMN exams_taxonomies.exam_pattern IS 'Free-text exam pattern overview on main exam row';
COMMENT ON COLUMN exams_taxonomies.eligibility IS 'Free-text eligibility summary on main exam row';
