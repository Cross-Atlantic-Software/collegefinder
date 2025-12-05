-- Migration: Add matric_subjects column to user_academics table
-- This allows storing subject breakdown for 10th standard separately from 12th standard

-- Add matric_subjects column
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_subjects JSONB;

-- Add comment
COMMENT ON COLUMN user_academics.matric_subjects IS '10th standard subject breakdown: [{"name": "Math", "percent": 89, "obtainedMarks": 89, "totalMarks": 100}, ...]';

