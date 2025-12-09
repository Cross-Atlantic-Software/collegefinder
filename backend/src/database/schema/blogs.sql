-- Blogs Table Schema
-- This file defines the college_finder_blogs table structure and related indexes

-- Blogs table
CREATE TABLE IF NOT EXISTS college_finder_blogs (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  title VARCHAR(500) NOT NULL,
  blog_image VARCHAR(500),
  teaser TEXT,
  summary TEXT,
  content_type VARCHAR(10) NOT NULL CHECK (content_type IN ('TEXT', 'VIDEO')),
  first_part TEXT,
  second_part TEXT,
  video_file VARCHAR(500),
  streams JSONB DEFAULT '[]'::jsonb, -- Array of stream IDs
  careers JSONB DEFAULT '[]'::jsonb, -- Array of career IDs
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_finder_blogs') THEN
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS slug VARCHAR(255);
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS title VARCHAR(500);
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS blog_image VARCHAR(500);
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS teaser TEXT;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS content_type VARCHAR(10);
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS first_part TEXT;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS second_part TEXT;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS video_file VARCHAR(500);
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS streams JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS careers JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for slug if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'college_finder_blogs_slug_key'
  ) THEN
    ALTER TABLE college_finder_blogs ADD CONSTRAINT college_finder_blogs_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Add check constraint for content_type if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'college_finder_blogs_content_type_check'
  ) THEN
    ALTER TABLE college_finder_blogs ADD CONSTRAINT college_finder_blogs_content_type_check 
      CHECK (content_type IN ('TEXT', 'VIDEO'));
  END IF;
END $$;

-- Indexes for blogs table
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON college_finder_blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_is_featured ON college_finder_blogs(is_featured);
CREATE INDEX IF NOT EXISTS idx_blogs_content_type ON college_finder_blogs(content_type);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON college_finder_blogs(created_at DESC);

-- Trigger to automatically update updated_at for blogs
DROP TRIGGER IF EXISTS update_blogs_updated_at ON college_finder_blogs;
CREATE TRIGGER update_blogs_updated_at BEFORE UPDATE ON college_finder_blogs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


