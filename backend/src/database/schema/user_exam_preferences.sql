-- User Exam Preferences Table
-- Stores user's target exams and previous exam attempts
CREATE TABLE IF NOT EXISTS user_exam_preferences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_exams INTEGER[], -- Array of exams_taxonomies IDs (foreign keys)
  previous_attempts JSONB, -- Array of objects: [{exam_id, year, rank}]
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes for user_exam_preferences table
CREATE INDEX IF NOT EXISTS idx_user_exam_preferences_user_id ON user_exam_preferences(user_id);

-- Trigger to automatically update updated_at for user_exam_preferences
DROP TRIGGER IF EXISTS update_user_exam_preferences_updated_at ON user_exam_preferences;
CREATE TRIGGER update_user_exam_preferences_updated_at BEFORE UPDATE ON user_exam_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_exam_preferences IS 'Stores user target exams and previous exam attempts';
COMMENT ON COLUMN user_exam_preferences.target_exams IS 'Array of exams_taxonomies.id values (foreign keys)';
COMMENT ON COLUMN user_exam_preferences.previous_attempts IS 'JSONB array of previous exam attempts: [{"exam_id": 1, "year": 2023, "rank": 5000}]';

