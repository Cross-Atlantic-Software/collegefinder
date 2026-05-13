-- Dashboard shortlists for coaching institutes and scholarships
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS user_shortlisted_institutes INTEGER[] DEFAULT '{}';
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS user_shortlisted_scholarships INTEGER[] DEFAULT '{}';

COMMENT ON COLUMN user_academics.user_shortlisted_institutes IS 'Institute IDs shortlisted by the user on the dashboard';
COMMENT ON COLUMN user_academics.user_shortlisted_scholarships IS 'Scholarship IDs shortlisted by the user on the dashboard';
