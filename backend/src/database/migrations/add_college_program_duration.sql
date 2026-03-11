-- Add program duration (years) to college_programs
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS duration_years INTEGER;

COMMENT ON COLUMN college_programs.duration_years IS 'Program duration in years';
