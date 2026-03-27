-- Allow longer answers (e.g. JSON for mcq_multiple, match_following)
ALTER TABLE user_attempt_answers
  ALTER COLUMN selected_option TYPE TEXT USING selected_option::TEXT;

COMMENT ON COLUMN user_attempt_answers.selected_option IS 'User answer: single option (A, 42, True), or JSON for multiple/match types';
