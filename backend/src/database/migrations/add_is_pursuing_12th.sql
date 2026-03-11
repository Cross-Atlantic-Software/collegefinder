-- Add is_pursuing_12th column to user_academics table
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS is_pursuing_12th BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN user_academics.is_pursuing_12th IS 'Whether the user is currently pursuing 12th standard (true) or has completed it (false)';

