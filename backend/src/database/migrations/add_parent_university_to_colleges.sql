-- Optional affiliating / parent university name for a campus or constituent college
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS parent_university VARCHAR(500);

COMMENT ON COLUMN colleges.parent_university IS 'Parent or affiliating university name (optional)';
