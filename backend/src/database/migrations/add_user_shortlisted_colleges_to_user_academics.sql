-- Dashboard college shortlist (same pattern as user_shortlisted_exams)
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS user_shortlisted_colleges INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN user_academics.user_shortlisted_colleges IS 'College IDs shortlisted by the user on the dashboard';
