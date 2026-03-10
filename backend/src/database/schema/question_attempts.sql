-- User Attempt Answers Table (formerly question_attempts)
-- One row per question answered (or skipped) within a user's exam attempt.
CREATE TABLE IF NOT EXISTS user_attempt_answers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  user_exam_attempt_id INTEGER NOT NULL REFERENCES user_exam_attempts(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  exam_mock_id INTEGER REFERENCES exam_mocks(id) ON DELETE SET NULL,
  selected_option TEXT,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE,
  time_spent_seconds INTEGER NOT NULL DEFAULT 0,
  attempt_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_user_id ON user_attempt_answers(user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_question_id ON user_attempt_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_attempt_id ON user_attempt_answers(user_exam_attempt_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_exam_id ON user_attempt_answers(exam_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_exam_mock_id ON user_attempt_answers(exam_mock_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_is_correct ON user_attempt_answers(is_correct);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_attempt_order ON user_attempt_answers(attempt_order);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_user_question ON user_attempt_answers(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_attempt_id_order ON user_attempt_answers(user_exam_attempt_id, attempt_order);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_exam_mock_user ON user_attempt_answers(exam_id, exam_mock_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_exam_user_correct ON user_attempt_answers(exam_id, user_id, is_correct);
CREATE INDEX IF NOT EXISTS idx_user_attempt_answers_mock_question_correct ON user_attempt_answers(exam_mock_id, question_id, is_correct);

ALTER TABLE user_attempt_answers DROP CONSTRAINT IF EXISTS user_attempt_answers_unique_attempt_question;
ALTER TABLE user_attempt_answers ADD CONSTRAINT user_attempt_answers_unique_attempt_question UNIQUE (user_exam_attempt_id, question_id);

COMMENT ON TABLE user_attempt_answers IS 'One row per question answered (or skipped) in a user exam attempt; used for analytics';
COMMENT ON COLUMN user_attempt_answers.user_exam_attempt_id IS 'Reference to user_exam_attempts';
COMMENT ON COLUMN user_attempt_answers.exam_mock_id IS 'Denormalized for analytics (nullable for non-mock attempts)';
