-- NIRF ranking (numeric) and admission timeline (text) on colleges.
-- Safe to re-run (IF NOT EXISTS).

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS nirf_ranking INTEGER;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS admission_timeline TEXT;
