-- College Location Table
-- Stores location information for colleges
CREATE TABLE IF NOT EXISTS college_location (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  state VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  google_map_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_location') THEN
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS state VARCHAR(255);
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS city VARCHAR(255);
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS google_map_url VARCHAR(500);
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_location ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_location_college_id ON college_location(college_id);
CREATE INDEX IF NOT EXISTS idx_college_location_state ON college_location(state);
CREATE INDEX IF NOT EXISTS idx_college_location_city ON college_location(city);

-- Trigger to automatically update updated_at for college_location
DROP TRIGGER IF EXISTS update_college_location_updated_at ON college_location;
CREATE TRIGGER update_college_location_updated_at BEFORE UPDATE ON college_location
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_location IS 'College location table - stores location information for colleges';
COMMENT ON COLUMN college_location.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_location.state IS 'State where the college is located';
COMMENT ON COLUMN college_location.city IS 'City where the college is located';
COMMENT ON COLUMN college_location.google_map_url IS 'Google Maps URL for the college location';

