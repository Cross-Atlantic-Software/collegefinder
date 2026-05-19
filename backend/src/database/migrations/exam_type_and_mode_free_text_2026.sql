-- Allow free-text exam_type and exam_pattern.mode (remove enum CHECK constraints).

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.conname::text AS conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'exams_taxonomies'
      AND c.contype = 'c'
  LOOP
    IF r.def ILIKE '%exam_type%' THEN
      EXECUTE format('ALTER TABLE exams_taxonomies DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;

  FOR r IN
    SELECT c.conname::text AS conname, pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    WHERE t.relname = 'exam_pattern'
      AND c.contype = 'c'
  LOOP
    IF r.def ILIKE '%mode%' THEN
      EXECUTE format('ALTER TABLE exam_pattern DROP CONSTRAINT %I', r.conname);
    END IF;
  END LOOP;
END $$;

ALTER TABLE exams_taxonomies
  ALTER COLUMN exam_type TYPE VARCHAR(255);

ALTER TABLE exam_pattern
  ALTER COLUMN mode TYPE VARCHAR(255);

COMMENT ON COLUMN exams_taxonomies.exam_type IS 'Exam level/type label (free text, e.g. National, State, University)';
COMMENT ON COLUMN exam_pattern.mode IS 'Exam delivery mode (free text, e.g. Online, Offline, Hybrid)';
