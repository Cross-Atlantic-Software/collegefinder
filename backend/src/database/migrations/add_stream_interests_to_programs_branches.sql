-- Link programs and branches to one stream (taxonomy) and many interests (career_goals_taxonomies).

ALTER TABLE programs ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS interest_ids INTEGER[] DEFAULT '{}';

ALTER TABLE branches ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS interest_ids INTEGER[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_programs_stream_id ON programs(stream_id);
CREATE INDEX IF NOT EXISTS idx_branches_stream_id ON branches(stream_id);

COMMENT ON COLUMN programs.stream_id IS 'Single stream taxonomy (e.g. PCM, Commerce)';
COMMENT ON COLUMN programs.interest_ids IS 'Array of career_goals_taxonomies.id values';
COMMENT ON COLUMN branches.stream_id IS 'Single stream taxonomy';
COMMENT ON COLUMN branches.interest_ids IS 'Array of career_goals_taxonomies.id values';
