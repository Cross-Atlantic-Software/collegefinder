-- Allow free-text admin input for exam type, mode, dates, fees, papers, and pattern numerics.
-- Idempotent where possible.

-- 1) exams_taxonomies.exam_type — drop fixed enum CHECK
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    FOR r IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'exams_taxonomies' AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%exam_type%'
    LOOP
      EXECUTE format('ALTER TABLE exams_taxonomies DROP CONSTRAINT %I', r.conname);
    END LOOP;
    ALTER TABLE exams_taxonomies ALTER COLUMN exam_type TYPE TEXT;
  END IF;
END $$;

-- 2) exams_taxonomies.number_of_papers — text (mock flow parses digits when needed)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams_taxonomies' AND column_name = 'number_of_papers'
  ) THEN
    ALTER TABLE exams_taxonomies ALTER COLUMN number_of_papers DROP DEFAULT;
    ALTER TABLE exams_taxonomies ALTER COLUMN number_of_papers DROP NOT NULL;
    ALTER TABLE exams_taxonomies
      ALTER COLUMN number_of_papers TYPE TEXT
      USING CASE WHEN number_of_papers IS NULL THEN NULL ELSE number_of_papers::text END;
  END IF;
END $$;

-- 3) exam_pattern.mode — drop fixed enum CHECK
DO $$
DECLARE r RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_pattern') THEN
    FOR r IN
      SELECT c.conname
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'exam_pattern' AND c.contype = 'c'
        AND pg_get_constraintdef(c.oid) ILIKE '%mode%'
    LOOP
      EXECUTE format('ALTER TABLE exam_pattern DROP CONSTRAINT %I', r.conname);
    END LOOP;
    ALTER TABLE exam_pattern ALTER COLUMN mode TYPE TEXT;
  END IF;
END $$;

-- 4) exam_pattern numeric columns → text (duration_minutes column stores admin text as-is)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_pattern' AND column_name = 'number_of_questions') THEN
    ALTER TABLE exam_pattern
      ALTER COLUMN number_of_questions TYPE TEXT
      USING CASE WHEN number_of_questions IS NULL THEN NULL ELSE number_of_questions::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_pattern' AND column_name = 'total_marks') THEN
    ALTER TABLE exam_pattern
      ALTER COLUMN total_marks TYPE TEXT
      USING CASE WHEN total_marks IS NULL THEN NULL ELSE total_marks::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_pattern' AND column_name = 'duration_minutes') THEN
    ALTER TABLE exam_pattern
      ALTER COLUMN duration_minutes TYPE TEXT
      USING CASE WHEN duration_minutes IS NULL THEN NULL ELSE duration_minutes::text END;
  END IF;
END $$;

-- 5) exam_dates — dates and fees as text
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_dates' AND column_name = 'application_start_date') THEN
    ALTER TABLE exam_dates
      ALTER COLUMN application_start_date TYPE TEXT
      USING CASE WHEN application_start_date IS NULL THEN NULL ELSE application_start_date::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_dates' AND column_name = 'application_close_date') THEN
    ALTER TABLE exam_dates
      ALTER COLUMN application_close_date TYPE TEXT
      USING CASE WHEN application_close_date IS NULL THEN NULL ELSE application_close_date::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_dates' AND column_name = 'exam_date') THEN
    ALTER TABLE exam_dates
      ALTER COLUMN exam_date TYPE TEXT
      USING CASE WHEN exam_date IS NULL THEN NULL ELSE exam_date::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_dates' AND column_name = 'result_date') THEN
    ALTER TABLE exam_dates
      ALTER COLUMN result_date TYPE TEXT
      USING CASE WHEN result_date IS NULL THEN NULL ELSE result_date::text END;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_dates' AND column_name = 'application_fees') THEN
    ALTER TABLE exam_dates
      ALTER COLUMN application_fees TYPE TEXT
      USING CASE WHEN application_fees IS NULL THEN NULL ELSE application_fees::text END;
  END IF;
END $$;

COMMENT ON COLUMN exams_taxonomies.exam_type IS 'Free-text exam type label from admin';
COMMENT ON COLUMN exams_taxonomies.number_of_papers IS 'Free-text papers label (e.g. 2); mock tests parse leading integer when numeric';
COMMENT ON COLUMN exam_pattern.mode IS 'Free-text exam mode from admin';
COMMENT ON COLUMN exam_pattern.duration_minutes IS 'Free-text duration as entered in admin (legacy column name)';
