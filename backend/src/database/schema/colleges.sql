-- Colleges Module - Normalized tables (same pattern as Exam module)
-- 1. Main colleges table
CREATE TABLE IF NOT EXISTS colleges (
  id SERIAL PRIMARY KEY,
  college_name VARCHAR(255) NOT NULL,
  college_location VARCHAR(500),
  college_type VARCHAR(50) CHECK (college_type IN ('Central', 'State', 'Private', 'Deemed')),
  college_logo VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_colleges_name ON colleges(college_name);
CREATE INDEX IF NOT EXISTS idx_colleges_type ON colleges(college_type);

DROP TRIGGER IF EXISTS update_colleges_updated_at ON colleges;
CREATE TRIGGER update_colleges_updated_at BEFORE UPDATE ON colleges
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. college_details
CREATE TABLE IF NOT EXISTS college_details (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  college_description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(college_id)
);

CREATE INDEX IF NOT EXISTS idx_college_details_college_id ON college_details(college_id);

DROP TRIGGER IF EXISTS update_college_details_updated_at ON college_details;
CREATE TRIGGER update_college_details_updated_at BEFORE UPDATE ON college_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. college_programs
CREATE TABLE IF NOT EXISTS college_programs (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  intake_capacity INTEGER,
  duration_years INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_programs_college_id ON college_programs(college_id);
CREATE INDEX IF NOT EXISTS idx_college_programs_program_id ON college_programs(program_id);

-- 4. college_previous_cutoff
CREATE TABLE IF NOT EXISTS college_previous_cutoff (
  id SERIAL PRIMARY KEY,
  college_program_id INTEGER NOT NULL REFERENCES college_programs(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  category VARCHAR(100),
  cutoff_rank INTEGER,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_previous_cutoff_program ON college_previous_cutoff(college_program_id);
CREATE INDEX IF NOT EXISTS idx_college_previous_cutoff_exam ON college_previous_cutoff(exam_id);

-- 5. college_expected_cutoff
CREATE TABLE IF NOT EXISTS college_expected_cutoff (
  id SERIAL PRIMARY KEY,
  college_program_id INTEGER NOT NULL REFERENCES college_programs(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  category VARCHAR(100),
  expected_rank INTEGER,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_expected_cutoff_program ON college_expected_cutoff(college_program_id);
CREATE INDEX IF NOT EXISTS idx_college_expected_cutoff_exam ON college_expected_cutoff(exam_id);

-- 6. college_seat_matrix
CREATE TABLE IF NOT EXISTS college_seat_matrix (
  id SERIAL PRIMARY KEY,
  college_program_id INTEGER NOT NULL REFERENCES college_programs(id) ON DELETE CASCADE,
  category VARCHAR(100),
  seat_count INTEGER,
  year INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_seat_matrix_program ON college_seat_matrix(college_program_id);

-- 7. college_key_dates
CREATE TABLE IF NOT EXISTS college_key_dates (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  event_name VARCHAR(255),
  event_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_key_dates_college_id ON college_key_dates(college_id);

-- 8. college_documents_required
CREATE TABLE IF NOT EXISTS college_documents_required (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  document_name VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_documents_required_college_id ON college_documents_required(college_id);

-- 9. college_counselling_process
CREATE TABLE IF NOT EXISTS college_counselling_process (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  step_number INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_college_counselling_process_college_id ON college_counselling_process(college_id);

-- 10. college_recommended_exams
CREATE TABLE IF NOT EXISTS college_recommended_exams (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(college_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_college_recommended_exams_college_id ON college_recommended_exams(college_id);
CREATE INDEX IF NOT EXISTS idx_college_recommended_exams_exam_id ON college_recommended_exams(exam_id);

COMMENT ON TABLE colleges IS 'Main college information';
COMMENT ON TABLE college_details IS 'Detailed description per college';
COMMENT ON TABLE college_programs IS 'College-program mapping with intake capacity';
COMMENT ON TABLE college_previous_cutoff IS 'Previous year cutoff by program and exam';
COMMENT ON TABLE college_expected_cutoff IS 'Expected cutoff by program and exam';
COMMENT ON TABLE college_seat_matrix IS 'Seat distribution by category';
COMMENT ON TABLE college_key_dates IS 'Important dates per college';
COMMENT ON TABLE college_documents_required IS 'Documents required for admission';
COMMENT ON TABLE college_counselling_process IS 'Counselling process steps';
COMMENT ON TABLE college_recommended_exams IS 'Exams accepted by college';
