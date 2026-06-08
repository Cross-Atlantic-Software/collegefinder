-- Additional coaching metadata on institutes (coaching table)
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS fee_type TEXT;
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS fee_band TEXT;
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS batch_category TEXT;
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS course_cycle TEXT;
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS parent_institute TEXT;

COMMENT ON COLUMN institutes.fee_type IS 'Fee type label (e.g. annual, per course)';
COMMENT ON COLUMN institutes.fee_band IS 'Fee band / range summary text';
COMMENT ON COLUMN institutes.batch_category IS 'Batch category label';
COMMENT ON COLUMN institutes.course_cycle IS 'Course cycle label (e.g. 1-year, 2-year)';
COMMENT ON COLUMN institutes.parent_institute IS 'Parent institute / brand name';
