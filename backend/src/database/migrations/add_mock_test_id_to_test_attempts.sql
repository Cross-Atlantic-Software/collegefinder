ALTER TABLE test_attempts ADD COLUMN IF NOT EXISTS mock_test_id INTEGER REFERENCES mock_tests(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_test_attempts_mock_test_id ON test_attempts(mock_test_id);
ALTER TABLE test_attempts ALTER COLUMN test_id DROP NOT NULL;
