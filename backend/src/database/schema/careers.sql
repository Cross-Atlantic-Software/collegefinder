-- Careers Table
-- Stores the available career options that can be selected for blogs
CREATE TABLE IF NOT EXISTS careers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'careers') THEN
    ALTER TABLE careers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE careers ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE careers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE careers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'careers_name_key'
  ) THEN
    ALTER TABLE careers ADD CONSTRAINT careers_name_key UNIQUE (name);
  END IF;
END $$;

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_careers_name ON careers(name);
CREATE INDEX IF NOT EXISTS idx_careers_status ON careers(status);

-- Trigger to automatically update updated_at for careers
DROP TRIGGER IF EXISTS update_careers_updated_at ON careers;
CREATE TRIGGER update_careers_updated_at BEFORE UPDATE ON careers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE careers IS 'Taxonomy table for career options that can be selected for blogs';
COMMENT ON COLUMN careers.name IS 'Display name for the career (e.g., Engineering, Medicine, Law)';
COMMENT ON COLUMN careers.status IS 'Active status of the career (true = active, false = inactive)';


