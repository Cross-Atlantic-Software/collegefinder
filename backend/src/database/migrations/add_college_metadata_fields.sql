-- Additional college metadata on colleges table
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(100);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS program_count INTEGER;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS placement_rate TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS program_fee TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS average_package TEXT;

COMMENT ON COLUMN colleges.abbreviation IS 'Short college abbreviation';
COMMENT ON COLUMN colleges.program_count IS 'Number of programs offered';
COMMENT ON COLUMN colleges.placement_rate IS 'Placement rate label or percentage text';
COMMENT ON COLUMN colleges.program_fee IS 'Typical program fee summary text';
COMMENT ON COLUMN colleges.average_package IS 'Average placement package summary text';
