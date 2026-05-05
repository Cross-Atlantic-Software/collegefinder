-- ExamFill — extend exam_adapters to support draft / published lifecycle and AI authorship.
-- Idempotent.

ALTER TABLE exam_adapters
  ADD COLUMN IF NOT EXISTS status          VARCHAR(20)  DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS is_ai_generated BOOLEAN      DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_by      VARCHAR(120),
  ADD COLUMN IF NOT EXISTS updated_by      VARCHAR(120);

-- Backfill existing rows: anything currently active is treated as published.
UPDATE exam_adapters
   SET status = 'published'
 WHERE is_active = TRUE
   AND (status IS NULL OR status = 'draft');

-- Allow only known statuses.
DO $$
BEGIN
  ALTER TABLE exam_adapters DROP CONSTRAINT IF EXISTS exam_adapters_status_check;
  ALTER TABLE exam_adapters ADD CONSTRAINT exam_adapters_status_check
    CHECK (status IN ('draft', 'published'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_exam_adapters_status ON exam_adapters(status);

-- Register the new admin module so module-based access control gates the CMS tab.
INSERT INTO modules (name, code) VALUES
  ('Form Adapters', 'exam_adapters')
ON CONFLICT (code) DO NOTHING;
