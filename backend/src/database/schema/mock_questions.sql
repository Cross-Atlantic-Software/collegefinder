-- Mock Questions Table
-- Maps questions to their mock tests with ordering
CREATE TABLE IF NOT EXISTS mock_questions (
  id SERIAL PRIMARY KEY,
  mock_test_id INTEGER NOT NULL REFERENCES mock_tests(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  -- Prevent duplicate question in the same mock
  UNIQUE(mock_test_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mock_questions_mock_test_id ON mock_questions(mock_test_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_question_id ON mock_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_mock_questions_mock_order ON mock_questions(mock_test_id, order_index);

COMMENT ON TABLE mock_questions IS 'Maps questions to mock tests with an explicit ordering index';
COMMENT ON COLUMN mock_questions.mock_test_id IS 'Reference to mock_tests';
COMMENT ON COLUMN mock_questions.question_id IS 'Reference to questions bank';
COMMENT ON COLUMN mock_questions.order_index IS 'Zero-based display order within the mock test';
