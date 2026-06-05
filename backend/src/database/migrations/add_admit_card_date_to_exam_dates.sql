ALTER TABLE exam_dates
  ADD COLUMN IF NOT EXISTS admit_card_date DATE;

COMMENT ON COLUMN exam_dates.admit_card_date IS 'Admit card / hall ticket release date for the exam';
