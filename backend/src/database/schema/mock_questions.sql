-- Exam Mock Questions Table (formerly mock_questions)
-- Which questions appear in which exam mock, and in what order.
CREATE TABLE IF NOT EXISTS exam_mock_questions (
  id SERIAL PRIMARY KEY,
  exam_mock_id INTEGER NOT NULL REFERENCES exam_mocks(id) ON DELETE CASCADE,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  UNIQUE(exam_mock_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_mock_questions_exam_mock_id ON exam_mock_questions(exam_mock_id);
CREATE INDEX IF NOT EXISTS idx_exam_mock_questions_question_id ON exam_mock_questions(question_id);
CREATE INDEX IF NOT EXISTS idx_exam_mock_questions_exam_id ON exam_mock_questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_mock_questions_mock_order ON exam_mock_questions(exam_mock_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_mock_questions_exam_mock_order ON exam_mock_questions(exam_id, exam_mock_id, order_index);

COMMENT ON TABLE exam_mock_questions IS 'Maps question_bank questions to exam mocks with display order';
COMMENT ON COLUMN exam_mock_questions.exam_mock_id IS 'Reference to exam_mocks';
COMMENT ON COLUMN exam_mock_questions.question_id IS 'Reference to questions (question bank)';
COMMENT ON COLUMN exam_mock_questions.exam_id IS 'Denormalized for analytics';
COMMENT ON COLUMN exam_mock_questions.order_index IS '1-based question order in this mock';
