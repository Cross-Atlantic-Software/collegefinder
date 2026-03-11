-- Migration: Add obtainedMarks and totalMarks to subjects JSONB structure
-- This migration updates the subjects column to support storing marks along with percentage
-- New structure: [{"name": "Physics", "percent": 89, "obtainedMarks": 89, "totalMarks": 100}, ...]

-- Note: This is a data structure change, not a schema change
-- The subjects JSONB column already exists and can store this structure
-- Existing data will continue to work (with only name and percent)
-- New data will include obtainedMarks and totalMarks

-- Update the column comment to reflect the new structure
COMMENT ON COLUMN user_academics.subjects IS 
'Array of subjects: [{"name": "Physics", "percent": 89, "obtainedMarks": 89, "totalMarks": 100}, ...]. 
For backward compatibility, "percent" is required, "obtainedMarks" and "totalMarks" are optional.';

