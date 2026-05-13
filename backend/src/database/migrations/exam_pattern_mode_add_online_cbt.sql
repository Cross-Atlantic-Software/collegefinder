-- Allow exam_pattern.mode = 'Online (CBT)' (column was CHECK-limited to Offline / Online / Hybrid).

DO $$
DECLARE
  r RECORD;
BEGIN
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

ALTER TABLE exam_pattern
  ADD CONSTRAINT exam_pattern_mode_check
  CHECK (mode IS NULL OR mode IN ('Offline', 'Online', 'Hybrid', 'Online (CBT)'));
