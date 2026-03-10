-- Add mock_test_id to test_attempts (only for existing DBs that still have old table names).
-- Fresh installs create user_exam_attempts with exam_mock_id directly.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_attempts') THEN
    ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS mock_test_id INTEGER REFERENCES mock_tests(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_test_attempts_mock_test_id ON test_attempts(mock_test_id);
    ALTER TABLE test_attempts ALTER COLUMN test_id DROP NOT NULL;
  END IF;
END $$;
