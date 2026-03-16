-- Multi-paper support: exams like JEE Advanced have 2 papers per mock test.
-- Adds number_of_papers to exams_taxonomies and paper_number to exam_mocks,
-- exam_mock_questions, and user_exam_attempts.

DO $$
BEGIN
  -- 1. exams_taxonomies: number_of_papers
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exams_taxonomies' AND column_name = 'number_of_papers'
  ) THEN
    ALTER TABLE exams_taxonomies ADD COLUMN number_of_papers INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- 2. exam_mocks: paper_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_mocks' AND column_name = 'paper_number'
  ) THEN
    ALTER TABLE exam_mocks ADD COLUMN paper_number INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- 3. exam_mock_questions: paper_number (denormalized)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_mock_questions' AND column_name = 'paper_number'
  ) THEN
    ALTER TABLE exam_mock_questions ADD COLUMN paper_number INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- 4. user_exam_attempts: paper_number
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_exam_attempts' AND column_name = 'paper_number'
  ) THEN
    ALTER TABLE user_exam_attempts ADD COLUMN paper_number INTEGER NOT NULL DEFAULT 1;
  END IF;

  -- 5. Update UNIQUE constraint on exam_mocks: (exam_id, order_index) -> (exam_id, order_index, paper_number)
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exam_mocks_exam_id_order_index_key'
  ) THEN
    ALTER TABLE exam_mocks DROP CONSTRAINT exam_mocks_exam_id_order_index_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'exam_mocks_exam_id_order_index_paper_number_key'
  ) THEN
    ALTER TABLE exam_mocks ADD CONSTRAINT exam_mocks_exam_id_order_index_paper_number_key
      UNIQUE (exam_id, order_index, paper_number);
  END IF;

  -- 6. Set JEE Advanced to 2 papers
  UPDATE exams_taxonomies SET number_of_papers = 2 WHERE code = 'JEE_ADVANCED';
END $$;

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_exam_mocks_exam_order_paper ON exam_mocks(exam_id, order_index, paper_number);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_paper_number ON user_exam_attempts(paper_number);
CREATE INDEX IF NOT EXISTS idx_user_exam_attempts_mock_paper ON user_exam_attempts(exam_mock_id, paper_number);

COMMENT ON COLUMN exams_taxonomies.number_of_papers IS 'Number of papers per mock test (e.g. 2 for JEE Advanced)';
COMMENT ON COLUMN exam_mocks.paper_number IS '1-based paper number within a mock (e.g. Paper 1 or Paper 2 for JEE Advanced)';
COMMENT ON COLUMN exam_mock_questions.paper_number IS 'Denormalized paper number from exam_mocks for queries';
COMMENT ON COLUMN user_exam_attempts.paper_number IS 'Which paper this attempt is for (1-based)';
