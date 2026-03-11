-- Subtopics Table
-- Stores subtopics that belong to topics
CREATE TABLE IF NOT EXISTS subtopics (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  description TEXT, -- Optional description
  sort_order INTEGER DEFAULT 0, -- Display order
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subtopics') THEN
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE;
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE subtopics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for name within topic if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'subtopics_topic_id_name_key'
  ) THEN
    ALTER TABLE subtopics ADD CONSTRAINT subtopics_topic_id_name_key UNIQUE (topic_id, name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subtopics_topic_id ON subtopics(topic_id);
CREATE INDEX IF NOT EXISTS idx_subtopics_name ON subtopics(name);
CREATE INDEX IF NOT EXISTS idx_subtopics_status ON subtopics(status);
CREATE INDEX IF NOT EXISTS idx_subtopics_sort_order ON subtopics(sort_order);

-- Trigger to automatically update updated_at for subtopics
DROP TRIGGER IF EXISTS update_subtopics_updated_at ON subtopics;
CREATE TRIGGER update_subtopics_updated_at BEFORE UPDATE ON subtopics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE subtopics IS 'Subtopics table - subtopics belong to topics';
COMMENT ON COLUMN subtopics.topic_id IS 'Foreign key reference to topics table';
COMMENT ON COLUMN subtopics.name IS 'Display name for the subtopic';
COMMENT ON COLUMN subtopics.status IS 'Active status of the subtopic (true = active, false = inactive)';
COMMENT ON COLUMN subtopics.description IS 'Optional description of the subtopic';
COMMENT ON COLUMN subtopics.sort_order IS 'Display order for sorting subtopics';

