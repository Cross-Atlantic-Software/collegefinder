CREATE TABLE IF NOT EXISTS scholarship_colleges (
  id SERIAL PRIMARY KEY,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (scholarship_id, college_id)
);

CREATE INDEX IF NOT EXISTS idx_scholarship_colleges_scholarship_id ON scholarship_colleges(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_colleges_college_id ON scholarship_colleges(college_id);
