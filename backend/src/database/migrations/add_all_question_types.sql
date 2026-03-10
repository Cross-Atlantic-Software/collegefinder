-- Update questions table to support all 8 question types
-- Migration: Add new question types to the CHECK constraint

-- 1. Drop old constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

-- 2. Add new constraint with all 8 types
ALTER TABLE questions ADD CONSTRAINT questions_question_type_check 
  CHECK (question_type IN (
    'mcq_single',           -- MCQ with single correct answer
    'mcq_multiple',         -- MCQ with multiple correct answers  
    'numerical',            -- Numerical/integer answer
    'paragraph',            -- Paragraph/comprehension based
    'assertion_reason',     -- Assertion-Reason type
    'match_following',      -- Match the following
    'true_false',           -- True/False
    'fill_blank'            -- Fill in the blanks
  ));

-- 3. Add column for paragraph/context (for paragraph and match-following types)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS paragraph_context TEXT;

-- 4. Add column for assertion and reason (for assertion-reason type)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS assertion TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS reason TEXT;

-- 5. Add column for match pairs (for match-following type) - stores JSONB array
-- Format: [{"left": "A. Item 1", "right": "P. Match 1", "correct_match": "P"}, ...]
ALTER TABLE questions ADD COLUMN IF NOT EXISTS match_pairs JSONB DEFAULT '[]'::jsonb;

-- 6. Update existing 'mcq' to 'mcq_single' for backward compatibility
UPDATE questions SET question_type = 'mcq_single' WHERE question_type = 'mcq';

-- 7. Add index on new columns
CREATE INDEX IF NOT EXISTS idx_questions_question_type_v2 ON questions(question_type);

-- 8. Add comments
COMMENT ON COLUMN questions.paragraph_context IS 'Paragraph/context text for paragraph-based and match-following questions';
COMMENT ON COLUMN questions.assertion IS 'Assertion statement for assertion-reason type questions';
COMMENT ON COLUMN questions.reason IS 'Reason statement for assertion-reason type questions';
COMMENT ON COLUMN questions.match_pairs IS 'JSONB array of match pairs for match-following questions';
