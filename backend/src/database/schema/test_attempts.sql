-- User Exam Attempts Table (formerly test_attempts)
-- One row per user starting a mock/exam (their attempt/session).
CREATE TABLE IF NOT EXISTS user_exam_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  exam_mock_id INTEGER REFERENCES exam_mocks(id) ON DELETE SET NULL,
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

CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_id ON user_exam_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_test_id ON user_exam_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_id ON user_exam_attempts(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_mock_id ON user_exam_attempts(exam_mock_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_completed_at ON user_exam_attempts(completed_at);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_total_score ON user_exam_attempts(total_score);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_user_exam ON user_exam_attempts(user_id, exam_id);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_exam_score ON user_exam_attempts(exam_id, total_score DESC);

COMMENT ON TABLE user_exam_attempts IS 'One row per user attempt at an exam/mock; aggregates score and stats when completed';
COMMENT ON COLUMN user_exam_attempts.exam_mock_id IS 'Set when attempt is for an exam mock (exam_mocks)';
