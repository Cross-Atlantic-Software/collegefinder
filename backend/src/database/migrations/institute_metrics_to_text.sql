-- Coaching institute statistics + course numeric-like fields as TEXT (free-form; avoids DECIMAL overflow).
-- Existing numeric values are preserved via ::text cast.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_statistics'
      AND c.column_name = 'ranking_score' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_statistics ALTER COLUMN ranking_score TYPE TEXT USING ranking_score::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_statistics'
      AND c.column_name = 'success_rate' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_statistics ALTER COLUMN success_rate TYPE TEXT USING success_rate::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_statistics'
      AND c.column_name = 'student_rating' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_statistics ALTER COLUMN student_rating TYPE TEXT USING student_rating::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_courses'
      AND c.column_name = 'duration_months' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_courses ALTER COLUMN duration_months TYPE TEXT USING duration_months::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_courses'
      AND c.column_name = 'fees' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_courses ALTER COLUMN fees TYPE TEXT USING fees::text';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'institute_courses'
      AND c.column_name = 'batch_size' AND c.data_type NOT IN ('text', 'character varying')
  ) THEN
    EXECUTE 'ALTER TABLE institute_courses ALTER COLUMN batch_size TYPE TEXT USING batch_size::text';
  END IF;
END $$;

COMMENT ON COLUMN institute_statistics.ranking_score IS 'Free-text metric (e.g. score or label)';
COMMENT ON COLUMN institute_statistics.success_rate IS 'Free-text metric (e.g. percentage or label)';
COMMENT ON COLUMN institute_statistics.student_rating IS 'Free-text rating (e.g. 1–5 or stars)';
COMMENT ON COLUMN institute_courses.duration_months IS 'Free-text duration (e.g. months or "12 weeks")';
COMMENT ON COLUMN institute_courses.fees IS 'Free-text fees (e.g. amount or "Contact")';
COMMENT ON COLUMN institute_courses.batch_size IS 'Free-text batch size';
