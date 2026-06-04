-- Exam taxonomy IDs where the user marked the registration form as already filled (dashboard)
ALTER TABLE user_academics
  ADD COLUMN IF NOT EXISTS already_filled_form INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN user_academics.already_filled_form IS 'exams_taxonomies IDs for exams whose application form the user already filled outside automation';
