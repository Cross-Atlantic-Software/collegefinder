-- Coaching Location Table
-- Stores location information for coaching centers
CREATE TABLE IF NOT EXISTS coaching_location (
  id SERIAL PRIMARY KEY,
  coaching_id INTEGER NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  branch_title VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  state VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  google_map_url VARCHAR(1000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coaching_location') THEN
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS coaching_id INTEGER REFERENCES coachings(id) ON DELETE CASCADE;
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS branch_title VARCHAR(255);
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS address TEXT;
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS state VARCHAR(100);
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS city VARCHAR(100);
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS google_map_url VARCHAR(1000);
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE coaching_location ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_location_coaching_id ON coaching_location(coaching_id);
CREATE INDEX IF NOT EXISTS idx_coaching_location_state ON coaching_location(state);
CREATE INDEX IF NOT EXISTS idx_coaching_location_city ON coaching_location(city);

-- Trigger to automatically update updated_at for coaching_location
DROP TRIGGER IF EXISTS update_coaching_location_updated_at ON coaching_location;
CREATE TRIGGER update_coaching_location_updated_at BEFORE UPDATE ON coaching_location
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coaching_location IS 'Coaching location table - stores branch locations for coaching centers';
COMMENT ON COLUMN coaching_location.coaching_id IS 'Foreign key reference to coachings table';
COMMENT ON COLUMN coaching_location.branch_title IS 'Branch title/name';
COMMENT ON COLUMN coaching_location.address IS 'Complete address of the branch';
COMMENT ON COLUMN coaching_location.state IS 'State where the branch is located';
COMMENT ON COLUMN coaching_location.city IS 'City where the branch is located';
COMMENT ON COLUMN coaching_location.google_map_url IS 'Google Maps URL for the location';
