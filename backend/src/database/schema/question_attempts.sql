-- Question Attempts Table
-- Stores individual question attempt details for analytics
CREATE TABLE IF NOT EXISTS question_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  test_attempt_id INTEGER NOT NULL REFERENCES test_attempts(id) ON DELETE CASCADE,
  selected_option VARCHAR(10),
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  attempt_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'question_attempts') THEN
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS user_id INTEGER;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS question_id INTEGER;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS test_attempt_id INTEGER;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS selected_option VARCHAR(10);
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT FALSE;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER DEFAULT 0;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS attempt_order INTEGER;
    ALTER TABLE question_attempts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_attempts_user_id_fkey'
  ) THEN
    ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_attempts_question_id_fkey'
  ) THEN
    ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_question_id_fkey 
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_attempts_test_attempt_id_fkey'
  ) THEN
    ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_test_attempt_id_fkey 
    FOREIGN KEY (test_attempt_id) REFERENCES test_attempts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create indexes for analytics and performance
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_id ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_question_id ON question_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_test_attempt_id ON question_attempts(test_attempt_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_is_correct ON question_attempts(is_correct);
CREATE INDEX IF NOT EXISTS idx_question_attempts_attempt_order ON question_attempts(attempt_order);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_question_attempts_user_question ON question_attempts(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_attempts_test_order ON question_attempts(test_attempt_id, attempt_order);

-- Unique constraint to prevent duplicate attempts for same question in same test
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'question_attempts_unique_test_question'
  ) THEN
    ALTER TABLE question_attempts ADD CONSTRAINT question_attempts_unique_test_question 
    UNIQUE (test_attempt_id, question_id);
  END IF;
END $$;

COMMENT ON TABLE question_attempts IS 'Individual question attempt details for comprehensive analytics';
COMMENT ON COLUMN question_attempts.user_id IS 'Reference to users table';
COMMENT ON COLUMN question_attempts.question_id IS 'Reference to questions table';
COMMENT ON COLUMN question_attempts.test_attempt_id IS 'Reference to test_attempts table';
COMMENT ON COLUMN question_attempts.selected_option IS 'Option selected by user (A, B, C, D for MCQ, or numerical value)';
COMMENT ON COLUMN question_attempts.is_correct IS 'Whether the selected answer was correct';
COMMENT ON COLUMN question_attempts.time_spent_seconds IS 'Time spent on this question in seconds';
COMMENT ON COLUMN question_attempts.attempt_order IS 'Order in which this question was attempted in the test';