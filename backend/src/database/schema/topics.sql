-- Topics Table
-- Stores topics that belong to chapters
CREATE TABLE IF NOT EXISTS topics (
  id SERIAL PRIMARY KEY,
  chapter_id INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  thumbnail VARCHAR(500),
  home_display BOOLEAN DEFAULT FALSE,
  status BOOLEAN DEFAULT TRUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS home_display BOOLEAN DEFAULT FALSE;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE topics ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'topics_chapter_id_name_key'
  ) THEN
    ALTER TABLE topics ADD CONSTRAINT topics_chapter_id_name_key UNIQUE (chapter_id, name);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_topics_chapter_id ON topics(chapter_id);
CREATE INDEX IF NOT EXISTS idx_topics_name ON topics(name);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);
CREATE INDEX IF NOT EXISTS idx_topics_home_display ON topics(home_display);
CREATE INDEX IF NOT EXISTS idx_topics_sort_order ON topics(sort_order);

DROP TRIGGER IF EXISTS update_topics_updated_at ON topics;
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON topics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE topics IS 'Topics table - topics belong to chapters';
COMMENT ON COLUMN topics.chapter_id IS 'Foreign key reference to chapters table';
COMMENT ON COLUMN topics.name IS 'Display name for the topic';
COMMENT ON COLUMN topics.thumbnail IS 'S3 URL/path for topic thumbnail image';
COMMENT ON COLUMN topics.home_display IS 'Whether to display this topic on homepage';
COMMENT ON COLUMN topics.status IS 'Active status of the topic';
COMMENT ON COLUMN topics.description IS 'Optional description of the topic';
COMMENT ON COLUMN topics.sort_order IS 'Display order for sorting topics';
