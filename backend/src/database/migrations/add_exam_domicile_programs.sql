-- Add domicile and programs support for exams
-- domicile: comma-separated state names where exam is applicable (e.g. state quota)
-- exam_program: many-to-many linking exams to programs (B.Tech, M.Tech, etc.)

-- Add domicile column to exam_eligibility_criteria
ALTER TABLE exam_eligibility_criteria ADD COLUMN IF NOT EXISTS domicile TEXT;

COMMENT ON COLUMN exam_eligibility_criteria.domicile IS 'Comma-separated state names where domicile is required for quota (e.g. Maharashtra, Karnataka)';

-- Create exam_program junction table (exam <-> program)
CREATE TABLE IF NOT EXISTS exam_program (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(exam_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_program_exam_id ON exam_program(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_program_program_id ON exam_program(program_id);

COMMENT ON TABLE exam_program IS 'Many-to-many: exams linked to programs (B.Tech, M.Tech, etc.)';
