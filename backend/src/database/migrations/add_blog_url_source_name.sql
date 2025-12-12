-- Migration: Add url and source_name columns to college_finder_blogs table
-- This migration adds the url and source_name fields to existing blog tables

-- Add url column if it doesn't exist
ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS url VARCHAR(500);

-- Add source_name column if it doesn't exist
ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS source_name VARCHAR(255);

-- Add comments for documentation
COMMENT ON COLUMN college_finder_blogs.url IS 'Third-party site link that opens in a new window when provided';
COMMENT ON COLUMN college_finder_blogs.source_name IS 'Source name for the blog article';
