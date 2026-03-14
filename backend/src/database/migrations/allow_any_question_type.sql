-- Allow any question_type string so LLM-returned types (including future/unknown) can be stored as-is.

ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_question_type_check;

ALTER TABLE questions ADD CONSTRAINT questions_question_type_check
  CHECK (char_length(trim(question_type)) >= 1 AND char_length(question_type) <= 80);
