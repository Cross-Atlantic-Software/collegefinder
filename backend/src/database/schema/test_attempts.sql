-- Test Attempts Table
-- Stores user test attempt results and analytics
CREATE TABLE IF NOT EXISTS test_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL DEFAULT 0,
  percentile DECIMAL(5,2),
  rank_position INTEGER,
  attempted_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  accuracy_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.0,
  time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  subject_wise_stats JSONB DEFAULT '{}'::jsonb,
  difficulty_wise_stats JSONB DEFAULT '{}'::jsonb,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'test_attempts') THEN
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS user_id INTEGER;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS test_id INTEGER;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS exam_id INTEGER;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS percentile DECIMAL(5,2);
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS rank_position INTEGER;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS attempted_count INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS correct_count INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS incorrect_count INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS skipped_count INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS accuracy_percentage DECIMAL(5,2) DEFAULT 0.0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS time_spent_minutes INTEGER DEFAULT 0;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS subject_wise_stats JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS difficulty_wise_stats JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_user_id_fkey'
  ) THEN
    ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_test_id_fkey'
  ) THEN
    ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_test_id_fkey 
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'test_attempts_exam_id_fkey'
  ) THEN
    ALTER TABLE test_attempts ADD CONSTRAINT test_attempts_exam_id_fkey 
    FOREIGN KEY (exam_id) REFERENCES exams_taxonomies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_id ON test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_test_id ON test_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam_id ON test_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_completed_at ON test_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_test_attempts_total_score ON test_attempts(total_score);
CREATE INDEX IF NOT EXISTS idx_test_attempts_percentile ON test_attempts(percentile);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_test_attempts_user_exam ON test_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_test_attempts_exam_score ON test_attempts(exam_id, total_score DESC);

COMMENT ON TABLE test_attempts IS 'User test attempt results and comprehensive analytics';
COMMENT ON COLUMN test_attempts.user_id IS 'Reference to users table';
COMMENT ON COLUMN test_attempts.test_id IS 'Reference to tests table';
COMMENT ON COLUMN test_attempts.exam_id IS 'Reference to exams_taxonomies table for easier analytics';
COMMENT ON COLUMN test_attempts.total_score IS 'Total score achieved in the test';
COMMENT ON COLUMN test_attempts.percentile IS 'Percentile rank among all test takers';
COMMENT ON COLUMN test_attempts.rank_position IS 'Absolute rank position';
COMMENT ON COLUMN test_attempts.attempted_count IS 'Number of questions attempted';
COMMENT ON COLUMN test_attempts.correct_count IS 'Number of correct answers';
COMMENT ON COLUMN test_attempts.incorrect_count IS 'Number of incorrect answers';
COMMENT ON COLUMN test_attempts.skipped_count IS 'Number of questions skipped';
COMMENT ON COLUMN test_attempts.accuracy_percentage IS 'Overall accuracy percentage';
COMMENT ON COLUMN test_attempts.time_spent_minutes IS 'Total time spent on the test in minutes';
COMMENT ON COLUMN test_attempts.subject_wise_stats IS 'JSONB object with subject-wise performance statistics';
COMMENT ON COLUMN test_attempts.difficulty_wise_stats IS 'JSONB object with difficulty-wise performance statistics';
COMMENT ON COLUMN test_attempts.completed_at IS 'Timestamp when the test was completed';