-- Link automation exams to taxonomy + exam_dates sync fields.

ALTER TABLE automation_exams
  ADD COLUMN IF NOT EXISTS taxonomy_exam_id INTEGER REFERENCES exams_taxonomies(id) ON DELETE SET NULL;

ALTER TABLE automation_exams
  ADD COLUMN IF NOT EXISTS mapping_status VARCHAR(20) NOT NULL DEFAULT 'not_mapped';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'automation_exams_mapping_status_check'
  ) THEN
    ALTER TABLE automation_exams
      ADD CONSTRAINT automation_exams_mapping_status_check
      CHECK (mapping_status IN ('mapped', 'not_mapped'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_automation_exams_taxonomy_exam_id
  ON automation_exams(taxonomy_exam_id);

COMMENT ON COLUMN automation_exams.taxonomy_exam_id IS 'Linked exams_taxonomies row — dates/fees sync from automation admin';
COMMENT ON COLUMN automation_exams.mapping_status IS 'AI field mapping status: mapped | not_mapped';

ALTER TABLE exam_dates
  ADD COLUMN IF NOT EXISTS counselling_start_date DATE;

ALTER TABLE exam_dates
  ADD COLUMN IF NOT EXISTS counselling_end_date DATE;

ALTER TABLE exam_dates
  ADD COLUMN IF NOT EXISTS ut_service_fee NUMERIC(12,2);

COMMENT ON COLUMN exam_dates.counselling_start_date IS 'Counselling window start date';
COMMENT ON COLUMN exam_dates.counselling_end_date IS 'Counselling window end date';
COMMENT ON COLUMN exam_dates.ut_service_fee IS 'Unitracko service fee in credits';

-- Migrate legacy single counselling_date into counselling_start_date when unset.
UPDATE exam_dates
   SET counselling_start_date = counselling_date
 WHERE counselling_start_date IS NULL
   AND counselling_date IS NOT NULL;
