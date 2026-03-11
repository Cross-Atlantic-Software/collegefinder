-- Migration: Add description and status to career_goals_taxonomies table
-- Date: 2024

-- Add description column
ALTER TABLE career_goals_taxonomies 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add status column (default to true for existing records)
ALTER TABLE career_goals_taxonomies 
ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;

-- Update existing records to be active by default
UPDATE career_goals_taxonomies 
SET status = TRUE 
WHERE status IS NULL;

-- Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_career_goals_taxonomies_status ON career_goals_taxonomies(status);

-- Add comments
COMMENT ON COLUMN career_goals_taxonomies.description IS 'Detailed description of the career goal';
COMMENT ON COLUMN career_goals_taxonomies.status IS 'Active status of the career goal (true = active, false = inactive). Only active career goals appear on the site.';
