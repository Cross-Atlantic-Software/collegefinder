-- Lectures Table
-- Stores lectures that belong to subtopics
CREATE TABLE IF NOT EXISTS lectures (
  id SERIAL PRIMARY KEY,
  topic_id INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  subtopic_id INTEGER NOT NULL REFERENCES subtopics(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) DEFAULT 'VIDEO', -- 'VIDEO' or 'ARTICLE'
  video_file VARCHAR(500), -- S3 URL/path for video file (for VIDEO type)
  iframe_code TEXT, -- Iframe embed code for video (for VIDEO type, alternative to video_file)
  article_content TEXT, -- Rich text content (for ARTICLE type)
  thumbnail VARCHAR(500), -- S3 URL/path for lecture thumbnail
  description TEXT, -- Optional description
  key_topics_to_be_covered TEXT, -- Optional outline (e.g. bulk Excel)
  youtube_title VARCHAR(500), -- Auto-fetched YouTube title
  youtube_channel_name VARCHAR(255), -- Auto-fetched channel name
  youtube_channel_id VARCHAR(64), -- YouTube channel id
  youtube_channel_url VARCHAR(500), -- YouTube channel URL
  youtube_like_count BIGINT, -- Snapshot count; may be null/hidden
  youtube_subscriber_count BIGINT, -- Snapshot count; may be null/hidden
  hook_summary TEXT, -- Gemini 2-line student hook (from metadata + taxonomies)
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  sort_order INTEGER DEFAULT 0, -- Display order within subtopic
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lectures') THEN
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS subtopic_id INTEGER REFERENCES subtopics(id) ON DELETE CASCADE;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS content_type VARCHAR(50) DEFAULT 'VIDEO';
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS video_file VARCHAR(500);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS iframe_code TEXT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS article_content TEXT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS thumbnail VARCHAR(500);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS key_topics_to_be_covered TEXT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_title VARCHAR(500);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_channel_name VARCHAR(255);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_channel_id VARCHAR(64);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_channel_url VARCHAR(500);
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_like_count BIGINT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS youtube_subscriber_count BIGINT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS hook_summary TEXT;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE lectures ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for name within subtopic if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lectures_subtopic_id_name_key'
  ) THEN
    ALTER TABLE lectures ADD CONSTRAINT lectures_subtopic_id_name_key UNIQUE (subtopic_id, name);
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lectures_topic_id ON lectures(topic_id);
CREATE INDEX IF NOT EXISTS idx_lectures_subtopic_id ON lectures(subtopic_id);
CREATE INDEX IF NOT EXISTS idx_lectures_name ON lectures(name);
CREATE INDEX IF NOT EXISTS idx_lectures_status ON lectures(status);
CREATE INDEX IF NOT EXISTS idx_lectures_sort_order ON lectures(sort_order);

-- Trigger to automatically update updated_at for lectures
DROP TRIGGER IF EXISTS update_lectures_updated_at ON lectures;
CREATE TRIGGER update_lectures_updated_at BEFORE UPDATE ON lectures
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE lectures IS 'Lectures table - lectures belong to subtopics';
COMMENT ON COLUMN lectures.topic_id IS 'Foreign key reference to topics table';
COMMENT ON COLUMN lectures.subtopic_id IS 'Foreign key reference to subtopics table';
COMMENT ON COLUMN lectures.name IS 'Display name for the lecture';
COMMENT ON COLUMN lectures.content_type IS 'Type of content: VIDEO or ARTICLE';
COMMENT ON COLUMN lectures.video_file IS 'S3 URL/path for video file (for VIDEO type)';
COMMENT ON COLUMN lectures.iframe_code IS 'Iframe embed code for video (for VIDEO type, alternative to video_file)';
COMMENT ON COLUMN lectures.article_content IS 'Rich text content with images (for ARTICLE type)';
COMMENT ON COLUMN lectures.thumbnail IS 'S3 URL/path for lecture thumbnail image';
COMMENT ON COLUMN lectures.description IS 'Optional description of the lecture';
COMMENT ON COLUMN lectures.key_topics_to_be_covered IS 'Optional key topics outline for the lecture';
COMMENT ON COLUMN lectures.youtube_title IS 'Auto-fetched YouTube video title when source is YouTube';
COMMENT ON COLUMN lectures.youtube_channel_name IS 'Auto-fetched YouTube channel name';
COMMENT ON COLUMN lectures.youtube_channel_id IS 'YouTube channel id';
COMMENT ON COLUMN lectures.youtube_channel_url IS 'Canonical YouTube channel URL';
COMMENT ON COLUMN lectures.youtube_like_count IS 'YouTube like count snapshot';
COMMENT ON COLUMN lectures.youtube_subscriber_count IS 'YouTube channel subscriber count snapshot';
COMMENT ON COLUMN lectures.hook_summary IS 'Short 2-sentence student hook (Gemini), generated after save from title, description, and taxonomies';
COMMENT ON COLUMN lectures.status IS 'Active status of the lecture (true = active, false = inactive)';
COMMENT ON COLUMN lectures.sort_order IS 'Display order for sorting lectures within subtopic';

