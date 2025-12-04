-- User Career Goals Table Schema
-- This file defines the user_career_goals table structure for storing career goals information

-- User career goals table
CREATE TABLE IF NOT EXISTS user_career_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interests INTEGER[], -- Array of career_goals_taxonomies IDs (foreign keys)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Add foreign key constraint check (PostgreSQL doesn't support array foreign keys directly)
-- We'll validate in application code, but add a comment for documentation
COMMENT ON COLUMN user_career_goals.interests IS 'Array of career_goals_taxonomies.id values (foreign keys)';

-- Indexes for user_career_goals table
CREATE INDEX IF NOT EXISTS idx_user_career_goals_user_id ON user_career_goals(user_id);

-- Trigger to automatically update updated_at for user_career_goals
DROP TRIGGER IF EXISTS update_user_career_goals_updated_at ON user_career_goals;
CREATE TRIGGER update_user_career_goals_updated_at BEFORE UPDATE ON user_career_goals
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


