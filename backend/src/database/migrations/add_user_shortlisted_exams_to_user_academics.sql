ALTER TABLE user_academics
ADD COLUMN IF NOT EXISTS user_shortlisted_exams INTEGER[] DEFAULT '{}';

