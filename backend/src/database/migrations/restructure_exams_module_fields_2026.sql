-- Restructure exams: optional code, single age limit, new fields, remove format/previous_year_cutoff,
-- category cutoffs as 4 columns, rename marking_scheme -> negative_marking, etc.
-- Idempotent: safe to run multiple times.

-- 1) exams_taxonomies: make code optional, add documents + counselling, drop format
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    -- Drop unique on code (may be named exams_taxonomies_code_key)
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'exams_taxonomies_code_key' AND conrelid = 'exams_taxonomies'::regclass) THEN
      ALTER TABLE exams_taxonomies DROP CONSTRAINT exams_taxonomies_code_key;
    END IF;
    -- Nullable code
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams_taxonomies' AND column_name = 'code' AND is_nullable = 'NO') THEN
      ALTER TABLE exams_taxonomies ALTER COLUMN code DROP NOT NULL;
    END IF;
    -- Turn empty string codes to NULL
    UPDATE exams_taxonomies SET code = NULL WHERE code IS NOT NULL AND trim(code) = '';
    -- Partial unique: non-empty codes only
    CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_taxonomies_code_unique
      ON exams_taxonomies (code) WHERE code IS NOT NULL AND trim(code) <> '';

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams_taxonomies' AND column_name = 'documents_required') THEN
      ALTER TABLE exams_taxonomies ADD COLUMN documents_required TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams_taxonomies' AND column_name = 'counselling') THEN
      ALTER TABLE exams_taxonomies ADD COLUMN counselling TEXT;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exams_taxonomies' AND column_name = 'format') THEN
      ALTER TABLE exams_taxonomies DROP COLUMN format;
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN exams_taxonomies.documents_required IS 'Required documents (free text) for the exam';
COMMENT ON COLUMN exams_taxonomies.counselling IS 'Counselling information (free text)';

-- 2) exam_dates: result date, application fees
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS result_date DATE;
ALTER TABLE exam_dates ADD COLUMN IF NOT EXISTS application_fees NUMERIC(12,2);

-- 3) exam_eligibility_criteria: single age_limit, drop min/max
ALTER TABLE exam_eligibility_criteria ADD COLUMN IF NOT EXISTS age_limit TEXT;
UPDATE exam_eligibility_criteria e
SET age_limit = sub.combined
FROM (
  SELECT id,
    CASE
      WHEN age_limit_min IS NOT NULL AND age_limit_max IS NOT NULL THEN
        trim(both ' ' from concat(age_limit_min::text, ' - ', age_limit_max::text))
      WHEN age_limit_min IS NOT NULL THEN age_limit_min::text
      WHEN age_limit_max IS NOT NULL THEN age_limit_max::text
      ELSE NULL
    END AS combined
  FROM exam_eligibility_criteria
) sub
WHERE e.id = sub.id AND (e.age_limit IS NULL OR e.age_limit = '') AND sub.combined IS NOT NULL;
ALTER TABLE exam_eligibility_criteria DROP COLUMN IF EXISTS age_limit_min;
ALTER TABLE exam_eligibility_criteria DROP COLUMN IF EXISTS age_limit_max;

-- 4) exam_pattern: negative_marking, total_marks, weightage_of_subjects
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_pattern' AND column_name = 'marking_scheme'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_pattern' AND column_name = 'negative_marking'
  ) THEN
    ALTER TABLE exam_pattern RENAME COLUMN marking_scheme TO negative_marking;
  END IF;
END $$;
ALTER TABLE exam_pattern ADD COLUMN IF NOT EXISTS total_marks INTEGER;
ALTER TABLE exam_pattern ADD COLUMN IF NOT EXISTS weightage_of_subjects TEXT;
COMMENT ON COLUMN exam_pattern.negative_marking IS 'Negative marking rules (text)';
COMMENT ON COLUMN exam_pattern.total_marks IS 'Total marks for the exam';
COMMENT ON COLUMN exam_pattern.weightage_of_subjects IS 'Weightage of subjects (free text)';

-- 5) exam_cutoff: four category columns, drop previous_year and combined category
ALTER TABLE exam_cutoff ADD COLUMN IF NOT EXISTS cutoff_general TEXT;
ALTER TABLE exam_cutoff ADD COLUMN IF NOT EXISTS cutoff_obc TEXT;
ALTER TABLE exam_cutoff ADD COLUMN IF NOT EXISTS cutoff_sc TEXT;
ALTER TABLE exam_cutoff ADD COLUMN IF NOT EXISTS cutoff_st TEXT;
UPDATE exam_cutoff
SET cutoff_general = btrim(category_wise_cutoff)
WHERE (cutoff_general IS NULL OR btrim(cutoff_general) = '')
  AND category_wise_cutoff IS NOT NULL
  AND btrim(category_wise_cutoff) <> '';
UPDATE exam_cutoff
SET cutoff_general = btrim(previous_year_cutoff)
WHERE (cutoff_general IS NULL OR btrim(cutoff_general) = '')
  AND previous_year_cutoff IS NOT NULL
  AND btrim(previous_year_cutoff) <> '';
ALTER TABLE exam_cutoff DROP COLUMN IF EXISTS previous_year_cutoff;
ALTER TABLE exam_cutoff DROP COLUMN IF EXISTS category_wise_cutoff;
