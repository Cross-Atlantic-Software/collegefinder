-- Link student applications to catalog exams so rows persist even before admin automation setup.
ALTER TABLE automation_applications
  ADD COLUMN IF NOT EXISTS taxonomy_exam_id INTEGER REFERENCES exams_taxonomies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_automation_applications_taxonomy_exam_id
  ON automation_applications(taxonomy_exam_id);

COMMENT ON COLUMN automation_applications.taxonomy_exam_id IS 'Catalog exam (exams_taxonomies) the student applied for from dashboard';

-- Backfill from linked automation exam where possible
UPDATE automation_applications aa
SET taxonomy_exam_id = e.taxonomy_exam_id
FROM automation_exams e
WHERE aa.exam_id = e.id
  AND aa.taxonomy_exam_id IS NULL
  AND e.taxonomy_exam_id IS NOT NULL;
