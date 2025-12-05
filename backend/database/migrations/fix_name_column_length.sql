-- Migration: Ensure name column is VARCHAR(255)
-- This fixes any truncation issues with the name field

-- Alter the name column to ensure it's VARCHAR(255)
ALTER TABLE users ALTER COLUMN name TYPE VARCHAR(255);

-- Add comment
COMMENT ON COLUMN users.name IS 'User full name (display name)';

