-- Strength Results Table Schema
-- Stores counsellor-filled strength analysis results for students

CREATE TABLE IF NOT EXISTS strength_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  counsellor_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  strengths JSONB NOT NULL DEFAULT '[]',
  career_recommendations JSONB NOT NULL DEFAULT '[]',
  report_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- strengths format: ["Strategic", "Achiever", "Learner", "Analytical", "Futuristic"]
-- career_recommendations format: [{"career": "Data Scientist", "details": "Leverages your analytical..."}, ...]

CREATE INDEX IF NOT EXISTS idx_strength_results_user_id ON strength_results(user_id);

DROP TRIGGER IF EXISTS update_strength_results_updated_at ON strength_results;
CREATE TRIGGER update_strength_results_updated_at BEFORE UPDATE ON strength_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
