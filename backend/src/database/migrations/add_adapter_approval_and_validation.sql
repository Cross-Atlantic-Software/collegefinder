-- UniTracko Part 1 — Admin Validation & Approval flow.
-- Adds an explicit approval lifecycle to exam_adapters (distinct from the
-- Builder's draft/published toggle) and a marker on fill_reports so the admin
-- validation run can be read back by exam, independent of which user filled.
-- Idempotent + additive. updated_at stays app-layer (no trigger).

ALTER TABLE exam_adapters
  ADD COLUMN IF NOT EXISTS approval_status VARCHAR(20) DEFAULT 'not_submitted',
  ADD COLUMN IF NOT EXISTS approved_at     TIMESTAMP,
  ADD COLUMN IF NOT EXISTS approved_by     VARCHAR(120);

ALTER TABLE fill_reports
  ADD COLUMN IF NOT EXISTS validation_run BOOLEAN DEFAULT FALSE;

-- Allow only known approval states.
DO $$
BEGIN
  ALTER TABLE exam_adapters DROP CONSTRAINT IF EXISTS exam_adapters_approval_status_check;
  ALTER TABLE exam_adapters ADD CONSTRAINT exam_adapters_approval_status_check
    CHECK (approval_status IN ('not_submitted', 'in_review', 'approved'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Backfill: an already-published adapter is effectively approved. Guarded on
-- the default state so re-runs (this runner re-executes every migration on
-- db.init()) never overwrite an admin's later decision.
UPDATE exam_adapters
   SET approval_status = 'approved',
       approved_at     = COALESCE(last_verified_at, updated_at)
 WHERE status = 'published'
   AND approval_status = 'not_submitted';

CREATE INDEX IF NOT EXISTS idx_exam_adapters_approval_status ON exam_adapters(approval_status);

-- Read the latest validation run per (exam, section) quickly.
CREATE INDEX IF NOT EXISTS idx_fill_reports_validation
  ON fill_reports(exam_id, section_name, created_at DESC)
  WHERE validation_run = TRUE;
