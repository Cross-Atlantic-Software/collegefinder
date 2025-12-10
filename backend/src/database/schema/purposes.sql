-- Purposes Table
-- Stores purposes that can be associated with lectures
CREATE TABLE IF NOT EXISTS purposes (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'purposes') THEN
    ALTER TABLE purposes ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE purposes ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE purposes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE purposes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purposes_name ON purposes(name);
CREATE INDEX IF NOT EXISTS idx_purposes_status ON purposes(status);

-- Trigger to automatically update updated_at for purposes
DROP TRIGGER IF EXISTS update_purposes_updated_at ON purposes;
CREATE TRIGGER update_purposes_updated_at BEFORE UPDATE ON purposes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE purposes IS 'Purposes table - purposes that can be associated with lectures';
COMMENT ON COLUMN purposes.name IS 'Display name for the purpose';
COMMENT ON COLUMN purposes.status IS 'Active status of the purpose (true = active, false = inactive)';

-- Lecture Purposes Junction Table (Many-to-Many)
CREATE TABLE IF NOT EXISTS lecture_purposes (
  lecture_id INTEGER NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  purpose_id INTEGER NOT NULL REFERENCES purposes(id) ON DELETE CASCADE,
  PRIMARY KEY (lecture_id, purpose_id)
);

-- Create indexes for junction table
CREATE INDEX IF NOT EXISTS idx_lecture_purposes_lecture_id ON lecture_purposes(lecture_id);
CREATE INDEX IF NOT EXISTS idx_lecture_purposes_purpose_id ON lecture_purposes(purpose_id);

COMMENT ON TABLE lecture_purposes IS 'Junction table for many-to-many relationship between lectures and purposes';

