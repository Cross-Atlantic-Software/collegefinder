-- College News Table
-- Stores news articles related to colleges
CREATE TABLE IF NOT EXISTS college_news (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  teaser VARCHAR(30) NOT NULL,
  url VARCHAR(500) NOT NULL,
  source_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_news') THEN
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS teaser VARCHAR(30);
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS url VARCHAR(500);
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_news_college_id ON college_news(college_id);
CREATE INDEX IF NOT EXISTS idx_college_news_title ON college_news(title);

-- Trigger to automatically update updated_at for college_news
DROP TRIGGER IF EXISTS update_college_news_updated_at ON college_news;
CREATE TRIGGER update_college_news_updated_at BEFORE UPDATE ON college_news
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_news IS 'College news table - stores news articles related to colleges';
COMMENT ON COLUMN college_news.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_news.title IS 'Title of the news article';
COMMENT ON COLUMN college_news.teaser IS 'Short teaser text (30 characters)';
COMMENT ON COLUMN college_news.url IS 'URL to the news article (opens in new window)';
COMMENT ON COLUMN college_news.source_name IS 'Name of the news source';

