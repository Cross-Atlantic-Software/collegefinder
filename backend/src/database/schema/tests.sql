-- Tests Table
-- Stores test configurations for different exams
CREATE TABLE IF NOT EXISTS tests (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  format_id VARCHAR(100), -- Format identifier (e.g., 'jee_main_paper1', 'neet_paper1')
  title VARCHAR(255) NOT NULL,
  test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('full_length', 'subject_wise', 'topic_wise')),
  total_questions INTEGER NOT NULL DEFAULT 0,
  total_marks INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  question_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[],
  sections JSONB DEFAULT '{}'::jsonb, -- Section-wise question distribution and configuration
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tests') THEN
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS exam_id INTEGER;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS format_id VARCHAR(100);
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS test_type VARCHAR(50);
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS total_questions INTEGER DEFAULT 0;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS total_marks INTEGER DEFAULT 0;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS question_ids INTEGER[] DEFAULT ARRAY[]::INTEGER[];
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE tests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tests_exam_id ON tests(exam_id);
CREATE INDEX IF NOT EXISTS idx_tests_format_id ON tests(format_id);
CREATE INDEX IF NOT EXISTS idx_tests_test_type ON tests(test_type);
CREATE INDEX IF NOT EXISTS idx_tests_is_active ON tests(is_active);
CREATE INDEX IF NOT EXISTS idx_tests_exam_format ON tests(exam_id, format_id);

-- Trigger to automatically update updated_at for tests
DROP TRIGGER IF EXISTS update_tests_updated_at ON tests;
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON tests
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tests IS 'Test configurations for different exams with question management';
COMMENT ON COLUMN tests.exam_id IS 'Reference to exams_taxonomies table';
COMMENT ON COLUMN tests.format_id IS 'Format identifier linking to exam format configuration';
COMMENT ON COLUMN tests.title IS 'Display title for the test (e.g., "Full Mock 01", "Physics Practice")';
COMMENT ON COLUMN tests.test_type IS 'Type of test: full_length, subject_wise, or topic_wise';
COMMENT ON COLUMN tests.total_questions IS 'Total number of questions in the test';
COMMENT ON COLUMN tests.total_marks IS 'Total marks for the test';
COMMENT ON COLUMN tests.duration_minutes IS 'Test duration in minutes';
COMMENT ON COLUMN tests.question_ids IS 'Array of question IDs included in this test';
COMMENT ON COLUMN tests.sections IS 'JSONB configuration for section-wise question distribution and settings';
COMMENT ON COLUMN tests.is_active IS 'Whether the test is active and available to users';