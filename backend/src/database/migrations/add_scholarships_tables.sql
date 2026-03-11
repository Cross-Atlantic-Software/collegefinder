-- Migration: Create scholarships module tables
-- Tables: scholarships, scholarship_eligible_categories, scholarship_applicable_states, scholarship_documents_required, scholarship_exams
-- Idempotent: uses CREATE TABLE IF NOT EXISTS

CREATE TABLE IF NOT EXISTS scholarships (
  id SERIAL PRIMARY KEY,
  scholarship_name VARCHAR(255) NOT NULL,
  conducting_authority VARCHAR(500),
  scholarship_type VARCHAR(100),
  description TEXT,
  stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL,
  income_limit VARCHAR(255),
  minimum_marks_required VARCHAR(255),
  scholarship_amount VARCHAR(255),
  selection_process TEXT,
  application_start_date DATE,
  application_end_date DATE,
  mode VARCHAR(100),
  official_website VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scholarships_name ON scholarships(scholarship_name);
CREATE INDEX IF NOT EXISTS idx_scholarships_stream_id ON scholarships(stream_id);
DROP TRIGGER IF EXISTS update_scholarships_updated_at ON scholarships;
CREATE TRIGGER update_scholarships_updated_at BEFORE UPDATE ON scholarships
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS scholarship_eligible_categories (
  id SERIAL PRIMARY KEY,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  category VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scholarship_eligible_categories_scholarship_id ON scholarship_eligible_categories(scholarship_id);

CREATE TABLE IF NOT EXISTS scholarship_applicable_states (
  id SERIAL PRIMARY KEY,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  state_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scholarship_applicable_states_scholarship_id ON scholarship_applicable_states(scholarship_id);

CREATE TABLE IF NOT EXISTS scholarship_documents_required (
  id SERIAL PRIMARY KEY,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  document_name VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_scholarship_documents_required_scholarship_id ON scholarship_documents_required(scholarship_id);

CREATE TABLE IF NOT EXISTS scholarship_exams (
  id SERIAL PRIMARY KEY,
  scholarship_id INTEGER NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(scholarship_id, exam_id)
);
CREATE INDEX IF NOT EXISTS idx_scholarship_exams_scholarship_id ON scholarship_exams(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_exams_exam_id ON scholarship_exams(exam_id);
