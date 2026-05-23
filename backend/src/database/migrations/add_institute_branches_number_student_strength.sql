-- Add free-text branches count and student strength to institutes table.

ALTER TABLE institutes ADD COLUMN IF NOT EXISTS branches_number TEXT;
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS student_strength TEXT;

COMMENT ON COLUMN institutes.branches_number IS 'Free-text number of branches (e.g. "12" or "10+")';
COMMENT ON COLUMN institutes.student_strength IS 'Free-text student strength (e.g. "5000+" or "2 lakh")';
