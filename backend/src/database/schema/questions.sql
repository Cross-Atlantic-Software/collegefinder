-- Questions Table
-- Central question bank for storing all test questions
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  subject VARCHAR(100) NOT NULL,
  section_name VARCHAR(100), -- Section name (e.g., 'mathematics', 'physics', 'chemistry')
  section_type VARCHAR(20) CHECK (section_type IN ('MCQ', 'Numerical')), -- Section type for format-based questions
  unit VARCHAR(100),
  topic VARCHAR(100),
  sub_topic VARCHAR(100),
  concept_tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type VARCHAR(20) NOT NULL CHECK (question_type IN ('mcq', 'numerical')),
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  correct_option VARCHAR(10) NOT NULL,
  solution_text TEXT,
  marks INTEGER NOT NULL DEFAULT 1,
  negative_marks DECIMAL(3,2) DEFAULT 0.25,
  source VARCHAR(20) NOT NULL CHECK (source IN ('LLM', 'Admin', 'Imported')),
  generation_prompt_version VARCHAR(50),
  usage_count INTEGER DEFAULT 0,
  reported_issue_count INTEGER DEFAULT 0,
  quality_rating DECIMAL(3,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS exam_id INTEGER;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS subject VARCHAR(100);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_name VARCHAR(100);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS section_type VARCHAR(20);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS unit VARCHAR(100);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic VARCHAR(100);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS sub_topic VARCHAR(100);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS concept_tags TEXT[] DEFAULT ARRAY[]::TEXT[];
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty VARCHAR(20);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_type VARCHAR(20);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS question_text TEXT;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS options JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS correct_option VARCHAR(10);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS solution_text TEXT;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS marks INTEGER DEFAULT 1;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS negative_marks DECIMAL(3,2) DEFAULT 0.25;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS source VARCHAR(20);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS generation_prompt_version VARCHAR(50);
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS reported_issue_count INTEGER DEFAULT 0;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS quality_rating DECIMAL(3,2) DEFAULT 0.0;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE questions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes for efficient question retrieval
CREATE INDEX IF NOT EXISTS idx_questions_exam_id ON questions(exam_id);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject);
CREATE INDEX IF NOT EXISTS idx_questions_section_name ON questions(section_name);
CREATE INDEX IF NOT EXISTS idx_questions_section_type ON questions(section_type);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_question_type ON questions(question_type);
CREATE INDEX IF NOT EXISTS idx_questions_source ON questions(source);
CREATE INDEX IF NOT EXISTS idx_questions_usage_count ON questions(usage_count);
CREATE INDEX IF NOT EXISTS idx_questions_quality_rating ON questions(quality_rating);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_questions_exam_subject_difficulty ON questions(exam_id, subject, difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_exam_topic ON questions(exam_id, topic);
CREATE INDEX IF NOT EXISTS idx_questions_section_filters ON questions(exam_id, section_name, section_type);
CREATE INDEX IF NOT EXISTS idx_questions_exam_section_subject ON questions(exam_id, section_name, subject);

-- Trigger to automatically update updated_at for questions
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE questions IS 'Central question bank storing all test questions with metadata';
COMMENT ON COLUMN questions.exam_id IS 'Reference to exams_taxonomies table';
COMMENT ON COLUMN questions.subject IS 'Subject name (e.g., Physics, Chemistry, Mathematics)';
COMMENT ON COLUMN questions.section_name IS 'Section name for format-based categorization (e.g., mathematics, physics, chemistry)';
COMMENT ON COLUMN questions.section_type IS 'Section type for format-based questions (MCQ or Numerical)';
COMMENT ON COLUMN questions.unit IS 'Unit or chapter name';
COMMENT ON COLUMN questions.topic IS 'Topic within the unit';
COMMENT ON COLUMN questions.sub_topic IS 'Sub-topic for granular categorization';
COMMENT ON COLUMN questions.concept_tags IS 'Array of concept tags for better categorization';
COMMENT ON COLUMN questions.difficulty IS 'Question difficulty: easy, medium, or hard';
COMMENT ON COLUMN questions.question_type IS 'Type of question: mcq or numerical';
COMMENT ON COLUMN questions.question_text IS 'The actual question text';
COMMENT ON COLUMN questions.options IS 'JSONB array of answer options for MCQ questions';
COMMENT ON COLUMN questions.correct_option IS 'Correct answer option (A, B, C, D for MCQ)';
COMMENT ON COLUMN questions.solution_text IS 'Detailed solution explanation';
COMMENT ON COLUMN questions.marks IS 'Marks awarded for correct answer';
COMMENT ON COLUMN questions.negative_marks IS 'Negative marks for incorrect answer';
COMMENT ON COLUMN questions.source IS 'Source of question: LLM (generated), Admin (manual), or Imported';
COMMENT ON COLUMN questions.generation_prompt_version IS 'Version of prompt used for LLM generation';
COMMENT ON COLUMN questions.usage_count IS 'Number of times this question has been used';
COMMENT ON COLUMN questions.reported_issue_count IS 'Number of times issues were reported for this question';
COMMENT ON COLUMN questions.quality_rating IS 'Quality rating based on user feedback and performance';