-- Exam Mocks Table (formerly mock_tests)
-- One mock test per exam (e.g. JEE Main Mock 1, Mock 2). Pre-generated, shared across all users.
CREATE TABLE IF NOT EXISTS exam_mocks (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'generating'
    CHECK (status IN ('ready', 'generating', 'failed')),
  total_questions INTEGER DEFAULT 0,
  created_by VARCHAR(20) NOT NULL DEFAULT 'system'
    CHECK (created_by IN ('system', 'manual')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_exam_mocks_exam_id ON exam_mocks(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_mocks_exam_order ON exam_mocks(exam_id, order_index);
CREATE INDEX IF NOT EXISTS idx_exam_mocks_status ON exam_mocks(status);

COMMENT ON TABLE exam_mocks IS 'Pre-generated mock tests per exam (Mock 1, 2, 3...). Ready = playable; generating = background job; failed = generation failed.';
COMMENT ON COLUMN exam_mocks.exam_id IS 'Reference to exams_taxonomies';
COMMENT ON COLUMN exam_mocks.order_index IS '1-based mock number for this exam';
COMMENT ON COLUMN exam_mocks.status IS 'ready | generating | failed';
COMMENT ON COLUMN exam_mocks.total_questions IS 'Number of questions in this mock';
