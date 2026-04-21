ALTER TABLE lectures ADD COLUMN IF NOT EXISTS key_topics_to_be_covered TEXT;

COMMENT ON COLUMN lectures.key_topics_to_be_covered IS 'Optional outline of key topics (e.g. from Excel bulk upload).';
