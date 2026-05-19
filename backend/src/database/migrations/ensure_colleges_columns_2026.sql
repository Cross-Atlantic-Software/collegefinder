-- Ensure colleges has columns required by College.create (logos + location).
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_url VARCHAR(2000);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_filename VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS city VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS parent_university VARCHAR(500);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS website VARCHAR(500);
