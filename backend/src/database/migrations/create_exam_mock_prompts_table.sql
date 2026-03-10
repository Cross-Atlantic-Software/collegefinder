-- Separate table for mock generation prompts per exam (by exam ID).
-- Used by the Mock Prompts admin section; mock generation reads from here first.
CREATE TABLE IF NOT EXISTS exam_mock_prompts (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  prompt TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_mock_prompts_exam_id ON exam_mock_prompts(exam_id);

COMMENT ON TABLE exam_mock_prompts IS 'Per-exam prompts for mock question generation; source of truth for Mock Prompts admin section.';

-- Migrate existing prompts from exams_taxonomies.generation_prompt into exam_mock_prompts
INSERT INTO exam_mock_prompts (exam_id, prompt, created_at, updated_at)
  SELECT id, generation_prompt, created_at, updated_at
  FROM exams_taxonomies
  WHERE generation_prompt IS NOT NULL AND TRIM(generation_prompt) != ''
ON CONFLICT (exam_id) DO UPDATE SET
  prompt = EXCLUDED.prompt,
  updated_at = CURRENT_TIMESTAMP;
