-- Subjects Table
-- Stores the available subject options that can be selected by users
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  streams JSONB DEFAULT '[]'::jsonb, -- Array of stream IDs (multi-select)
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subjects') THEN
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS streams JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subjects_name_key'
  ) THEN
    ALTER TABLE subjects ADD CONSTRAINT subjects_name_key UNIQUE (name);
  END IF;
END $$;

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_subjects_name ON subjects(name);
CREATE INDEX IF NOT EXISTS idx_subjects_status ON subjects(status);

-- Trigger to automatically update updated_at for subjects
DROP TRIGGER IF EXISTS update_subjects_updated_at ON subjects;
CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subjects IS 'Taxonomy table for subject options that can be selected by users';
COMMENT ON COLUMN subjects.name IS 'Display name for the subject (e.g., Mathematics, Physics, Chemistry)';
COMMENT ON COLUMN subjects.streams IS 'Array of stream IDs that this subject belongs to (multi-select)';
COMMENT ON COLUMN subjects.status IS 'Active status of the subject (true = active, false = inactive)';

