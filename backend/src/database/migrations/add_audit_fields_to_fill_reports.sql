-- ============================================================================
-- Audit fields for the One-Click Form Filling report.
-- Spec ("User Verification & Transparency"): the report must capture
-- "Changes made by the student" and "User confirmations" alongside the
-- information submitted and timestamps already stored on fill_reports.
--
-- Idempotent (IF NOT EXISTS) — safe to run more than once.
-- ============================================================================

ALTER TABLE fill_reports
  ADD COLUMN IF NOT EXISTS student_changes JSONB,      -- diff the student made on the review screen: { "address.city": { "from": "...", "to": "..." }, ... }
  ADD COLUMN IF NOT EXISTS confirmed_at    TIMESTAMP;  -- when the student clicked "Confirm & Fill" (their acknowledgement). NULL = filled without student review (e.g. admin builder).
