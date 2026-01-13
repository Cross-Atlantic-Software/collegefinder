-- Coachings Table
-- Stores coaching information
CREATE TABLE IF NOT EXISTS coachings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo VARCHAR(500), -- S3 URL/path for logo
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coachings') THEN
    ALTER TABLE coachings ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE coachings ADD COLUMN IF NOT EXISTS logo VARCHAR(500);
    ALTER TABLE coachings ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE coachings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE coachings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coachings_name ON coachings(name);

-- Trigger to automatically update updated_at for coachings
DROP TRIGGER IF EXISTS update_coachings_updated_at ON coachings;
CREATE TRIGGER update_coachings_updated_at BEFORE UPDATE ON coachings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coachings IS 'Coachings table - stores coaching center information';
COMMENT ON COLUMN coachings.name IS 'Coaching center name';
COMMENT ON COLUMN coachings.logo IS 'S3 URL/path for coaching logo';
COMMENT ON COLUMN coachings.description IS 'Coaching center description';
