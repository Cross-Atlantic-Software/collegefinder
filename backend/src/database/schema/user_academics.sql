-- User Academics Table Schema
-- This file defines the user_academics table structure for storing academic profile information

-- User academics table
CREATE TABLE IF NOT EXISTS user_academics (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Matric (10th) fields
  matric_board VARCHAR(100),
  matric_school_name VARCHAR(255),
  matric_passing_year INTEGER,
  matric_roll_number VARCHAR(50),
  matric_total_marks DECIMAL(10, 2),
  matric_obtained_marks DECIMAL(10, 2),
  matric_percentage DECIMAL(5, 2),
  -- Post-Matric (12th) fields
  postmatric_board VARCHAR(100),
  postmatric_school_name VARCHAR(255),
  postmatric_passing_year INTEGER,
  postmatric_roll_number VARCHAR(50),
  postmatric_total_marks DECIMAL(10, 2),
  postmatric_obtained_marks DECIMAL(10, 2),
  postmatric_percentage DECIMAL(5, 2),
  stream VARCHAR(100), -- PCM, PCB, Commerce, Humanities/Arts, Others
  subjects JSONB, -- Array of subjects for 12th: [{"subject_id": 1, "name": "Physics", "percent": 89}, ...]
  matric_subjects JSONB, -- Array of subjects for 10th: [{"subject_id": 1, "name": "Math", "percent": 89}, ...]
  is_pursuing_12th BOOLEAN DEFAULT false, -- Whether user is currently pursuing 12th
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Ensure all columns exist on older databases
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_board VARCHAR(100);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_school_name VARCHAR(255);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_passing_year INTEGER;
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_roll_number VARCHAR(50);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_total_marks DECIMAL(10, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_obtained_marks DECIMAL(10, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_percentage DECIMAL(5, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_board VARCHAR(100);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_school_name VARCHAR(255);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_passing_year INTEGER;
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_roll_number VARCHAR(50);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_total_marks DECIMAL(10, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_obtained_marks DECIMAL(10, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_percentage DECIMAL(5, 2);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS stream VARCHAR(100);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS subjects JSONB;
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_subjects JSONB;
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS is_pursuing_12th BOOLEAN DEFAULT false;

-- Add comments
COMMENT ON COLUMN user_academics.matric_board IS '10th standard board name';
COMMENT ON COLUMN user_academics.matric_school_name IS '10th standard school name';
COMMENT ON COLUMN user_academics.matric_passing_year IS '10th standard passing year';
COMMENT ON COLUMN user_academics.matric_roll_number IS '10th standard roll number';
COMMENT ON COLUMN user_academics.matric_total_marks IS '10th standard total marks';
COMMENT ON COLUMN user_academics.matric_obtained_marks IS '10th standard obtained marks';
COMMENT ON COLUMN user_academics.matric_percentage IS '10th standard percentage';
COMMENT ON COLUMN user_academics.postmatric_board IS '12th standard board name';
COMMENT ON COLUMN user_academics.postmatric_school_name IS '12th standard school name';
COMMENT ON COLUMN user_academics.postmatric_passing_year IS '12th standard passing year';
COMMENT ON COLUMN user_academics.postmatric_roll_number IS '12th standard roll number';
COMMENT ON COLUMN user_academics.postmatric_total_marks IS '12th standard total marks';
COMMENT ON COLUMN user_academics.postmatric_obtained_marks IS '12th standard obtained marks';
COMMENT ON COLUMN user_academics.postmatric_percentage IS '12th standard percentage';
COMMENT ON COLUMN user_academics.stream IS '12th standard stream: PCM, PCB, Commerce, Humanities/Arts, Others';
COMMENT ON COLUMN user_academics.subjects IS '12th standard subject breakdown: [{"name": "Physics", "percent": 89}, ...]';
COMMENT ON COLUMN user_academics.matric_subjects IS '10th standard subject breakdown: [{"name": "Math", "percent": 89, "obtainedMarks": 89, "totalMarks": 100}, ...]';
COMMENT ON COLUMN user_academics.is_pursuing_12th IS 'Whether the user is currently pursuing 12th standard (true) or has completed it (false)';

-- Indexes for user_academics table
CREATE INDEX IF NOT EXISTS idx_user_academics_user_id ON user_academics(user_id);

-- Trigger to automatically update updated_at for user_academics
DROP TRIGGER IF EXISTS update_user_academics_updated_at ON user_academics;
CREATE TRIGGER update_user_academics_updated_at BEFORE UPDATE ON user_academics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

