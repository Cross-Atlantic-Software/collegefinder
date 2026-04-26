-- Stream + interest (career goal taxonomy) -> recommended program IDs and exam IDs (from name resolution in admin Excel upload)
CREATE TABLE IF NOT EXISTS stream_interest_recommendation_mappings (
  id SERIAL PRIMARY KEY,
  stream_id INTEGER NOT NULL REFERENCES streams(id) ON DELETE CASCADE,
  interest_id INTEGER NOT NULL REFERENCES career_goals_taxonomies(id) ON DELETE CASCADE,
  program_ids INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  exam_ids INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (stream_id, interest_id)
);

CREATE INDEX IF NOT EXISTS idx_sirm_stream_id ON stream_interest_recommendation_mappings(stream_id);
CREATE INDEX IF NOT EXISTS idx_sirm_interest_id ON stream_interest_recommendation_mappings(interest_id);

DROP TRIGGER IF EXISTS update_stream_interest_recommendation_mappings_updated_at ON stream_interest_recommendation_mappings;
CREATE TRIGGER update_stream_interest_recommendation_mappings_updated_at
BEFORE UPDATE ON stream_interest_recommendation_mappings
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO modules (name, code) VALUES ('Mapping', 'mapping')
ON CONFLICT (code) DO NOTHING;
