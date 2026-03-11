-- User Other Info Table
-- Stores additional user information (medium, language, program preferences, exam city preferences)
CREATE TABLE IF NOT EXISTS user_other_info (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  medium VARCHAR(50), -- English, Hindi, Regional
  language VARCHAR(255), -- Language preference (text)
  program_ids INTEGER[], -- Array of program IDs (foreign keys to programs table)
  exam_city_ids INTEGER[], -- Array of exam city IDs (foreign keys to exam_city table)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_other_info') THEN
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS medium VARCHAR(50);
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS language VARCHAR(255);
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS program_ids INTEGER[];
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS exam_city_ids INTEGER[];
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE user_other_info ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_other_info_user_id ON user_other_info(user_id);

-- Trigger to automatically update updated_at for user_other_info
DROP TRIGGER IF EXISTS update_user_other_info_updated_at ON user_other_info;
CREATE TRIGGER update_user_other_info_updated_at BEFORE UPDATE ON user_other_info
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_other_info IS 'Stores additional user information (medium, language, program preferences, exam city preferences)';
COMMENT ON COLUMN user_other_info.medium IS 'Medium of examination: English, Hindi, or Regional';
COMMENT ON COLUMN user_other_info.language IS 'Language preference (free text)';
COMMENT ON COLUMN user_other_info.program_ids IS 'Array of program IDs (up to 3 preferences)';
COMMENT ON COLUMN user_other_info.exam_city_ids IS 'Array of exam city IDs (up to 4 preferences)';


