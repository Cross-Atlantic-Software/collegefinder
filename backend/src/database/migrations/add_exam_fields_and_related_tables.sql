-- Migration: Add examLogo, examType, conductingAuthority to exams_taxonomies
-- And create related tables: exam_dates, exam_eligibility_criteria, exam_pattern, exam_cutoff, exam_career_goal
-- Date: 2024
-- 
-- PRODUCTION-SAFE MIGRATION:
-- - Uses CREATE TABLE IF NOT EXISTS for all new tables (will create in production)
-- - Uses conditional logic to add columns only if table exists
-- - Idempotent: can be run multiple times without errors
-- - Will create all 5 related tables in fresh production databases
-- - Handles both existing databases (adds columns) and new databases (creates tables)

-- Add new fields to exams_taxonomies (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    -- Add exam_logo column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exams_taxonomies' AND column_name = 'exam_logo'
    ) THEN
      ALTER TABLE exams_taxonomies ADD COLUMN exam_logo VARCHAR(500);
    END IF;

    -- Add exam_type column with constraint
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exams_taxonomies' AND column_name = 'exam_type'
    ) THEN
      ALTER TABLE exams_taxonomies 
      ADD COLUMN exam_type VARCHAR(50) CHECK (exam_type IN ('National', 'State', 'Institute'));
    END IF;

    -- Add conducting_authority column
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exams_taxonomies' AND column_name = 'conducting_authority'
    ) THEN
      ALTER TABLE exams_taxonomies ADD COLUMN conducting_authority VARCHAR(255);
    END IF;
  END IF;
END $$;

-- Create exam_dates table
CREATE TABLE IF NOT EXISTS exam_dates (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  application_start_date DATE,
  application_close_date DATE,
  exam_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id)
);

-- Create exam_eligibility_criteria table
CREATE TABLE IF NOT EXISTS exam_eligibility_criteria (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  stream_ids INTEGER[] DEFAULT '{}', -- Array of stream IDs from streams table
  subject_ids INTEGER[] DEFAULT '{}', -- Array of subject IDs from subjects table
  age_limit_min INTEGER,
  age_limit_max INTEGER,
  attempt_limit INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id)
);

-- Create exam_pattern table
CREATE TABLE IF NOT EXISTS exam_pattern (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  mode VARCHAR(20) CHECK (mode IN ('Offline', 'Online', 'Hybrid')),
  number_of_questions INTEGER,
  marking_scheme TEXT, -- JSON or text description
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id)
);

-- Create exam_cutoff table
CREATE TABLE IF NOT EXISTS exam_cutoff (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  previous_year_cutoff TEXT, -- JSON or text description
  ranks_percentiles TEXT, -- JSON or text description
  category_wise_cutoff TEXT, -- JSON or text description
  target_rank_range TEXT, -- JSON or text description for top colleges
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id)
);

-- Create exam_career_goal table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS exam_career_goal (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  career_goal_id INTEGER NOT NULL REFERENCES career_goals_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, career_goal_id) -- Prevent duplicate relationships
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_dates_exam_id ON exam_dates(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_eligibility_criteria_exam_id ON exam_eligibility_criteria(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_pattern_exam_id ON exam_pattern(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_cutoff_exam_id ON exam_cutoff(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_career_goal_exam_id ON exam_career_goal(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_career_goal_career_goal_id ON exam_career_goal(career_goal_id);

-- Add triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exam_dates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_exam_eligibility_criteria_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_exam_pattern_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_exam_cutoff_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_exam_dates_updated_at ON exam_dates;
CREATE TRIGGER trigger_update_exam_dates_updated_at
  BEFORE UPDATE ON exam_dates
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_dates_updated_at();

DROP TRIGGER IF EXISTS trigger_update_exam_eligibility_criteria_updated_at ON exam_eligibility_criteria;
CREATE TRIGGER trigger_update_exam_eligibility_criteria_updated_at
  BEFORE UPDATE ON exam_eligibility_criteria
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_eligibility_criteria_updated_at();

DROP TRIGGER IF EXISTS trigger_update_exam_pattern_updated_at ON exam_pattern;
CREATE TRIGGER trigger_update_exam_pattern_updated_at
  BEFORE UPDATE ON exam_pattern
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_pattern_updated_at();

DROP TRIGGER IF EXISTS trigger_update_exam_cutoff_updated_at ON exam_cutoff;
CREATE TRIGGER trigger_update_exam_cutoff_updated_at
  BEFORE UPDATE ON exam_cutoff
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_cutoff_updated_at();

-- Add comments
COMMENT ON COLUMN exams_taxonomies.exam_logo IS 'S3 URL for the exam logo/image';
COMMENT ON COLUMN exams_taxonomies.exam_type IS 'Type of exam: National, State, or Institute level';
COMMENT ON COLUMN exams_taxonomies.conducting_authority IS 'Name of the authority conducting the exam';

COMMENT ON TABLE exam_dates IS 'Stores important dates for exams (application and exam dates)';
COMMENT ON TABLE exam_eligibility_criteria IS 'Stores eligibility criteria for exams (streams, subjects, age, attempts)';
COMMENT ON TABLE exam_pattern IS 'Stores exam pattern details (mode, questions, marking, duration)';
COMMENT ON TABLE exam_cutoff IS 'Stores cutoff information for exams (ranks, percentiles, category-wise)';
COMMENT ON TABLE exam_career_goal IS 'Many-to-many relationship table linking exams to career goals';
