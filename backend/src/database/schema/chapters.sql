-- Chapters Table
-- Stores chapters that belong to subjects (between subject and topic in taxonomy)
CREATE TABLE IF NOT EXISTS chapters (
  id SERIAL PRIMARY KEY,
  sub_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT TRUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chapters') THEN
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS sub_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE chapters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chapters_sub_id_name_key'
  ) THEN
    ALTER TABLE chapters ADD CONSTRAINT chapters_sub_id_name_key UNIQUE (sub_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_chapters_sub_id ON chapters(sub_id);
CREATE INDEX IF NOT EXISTS idx_chapters_name ON chapters(name);
CREATE INDEX IF NOT EXISTS idx_chapters_status ON chapters(status);
CREATE INDEX IF NOT EXISTS idx_chapters_sort_order ON chapters(sort_order);

DROP TRIGGER IF EXISTS update_chapters_updated_at ON chapters;
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE chapters IS 'Chapters table - chapters belong to subjects';
COMMENT ON COLUMN chapters.sub_id IS 'Foreign key reference to subjects table';
COMMENT ON COLUMN chapters.name IS 'Display name for the chapter';
