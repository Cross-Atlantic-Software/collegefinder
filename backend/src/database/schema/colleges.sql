-- Colleges Table
-- Stores college information
CREATE TABLE IF NOT EXISTS colleges (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  ranking INTEGER,
  description TEXT,
  logo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colleges') THEN
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS ranking INTEGER;
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_url VARCHAR(500);
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE colleges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(name);
CREATE INDEX IF NOT EXISTS idx_colleges_ranking ON colleges(ranking);

-- Trigger to automatically update updated_at for colleges
DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE colleges IS 'Colleges table - stores college information';
COMMENT ON COLUMN colleges.name IS 'Name of the college';
COMMENT ON COLUMN colleges.ranking IS 'Ranking of the college';
COMMENT ON COLUMN colleges.description IS 'Description of the college';
COMMENT ON COLUMN colleges.logo_url IS 'URL/path to the college logo image';

