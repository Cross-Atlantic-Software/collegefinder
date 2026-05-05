-- Tag each interest (career goal taxonomy) with a stream for onboarding filtering.
ALTER TABLE career_goals_taxonomies
  ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_career_goals_taxonomies_stream_id
  ON career_goals_taxonomies(stream_id);

COMMENT ON COLUMN career_goals_taxonomies.stream_id IS 'Stream this interest belongs to - onboarding shows only interests matching the selected stream';
