ALTER TABLE exam_dates
  ADD COLUMN IF NOT EXISTS counselling_date DATE;

COMMENT ON COLUMN exam_dates.counselling_date IS 'Counselling start / registration date for the exam';
