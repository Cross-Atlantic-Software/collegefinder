-- Institutes (Coachings) Module - Same pattern as Exam/College modules
-- 1. Main institutes table
CREATE TABLE IF NOT EXISTS institutes (
  id SERIAL PRIMARY KEY,
  institute_name VARCHAR(255) NOT NULL,
  institute_location VARCHAR(500),
  type VARCHAR(20) CHECK (type IN ('offline', 'online', 'hybrid')),
  logo VARCHAR(500),
  website VARCHAR(500),
  contact_number VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutes_name ON institutes(institute_name);
CREATE INDEX IF NOT EXISTS idx_institutes_type ON institutes(type);

DROP TRIGGER IF EXISTS update_institutes_updated_at ON institutes;
CREATE TRIGGER update_institutes_updated_at BEFORE UPDATE ON institutes
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. institute_details
CREATE TABLE IF NOT EXISTS institute_details (
  id SERIAL PRIMARY KEY,
  institute_id INTEGER NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  institute_description TEXT,
  demo_available BOOLEAN DEFAULT FALSE,
  scholarship_available BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institute_id)
);

CREATE INDEX IF NOT EXISTS idx_institute_details_institute_id ON institute_details(institute_id);

DROP TRIGGER IF EXISTS update_institute_details_updated_at ON institute_details;
CREATE TRIGGER update_institute_details_updated_at BEFORE UPDATE ON institute_details
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. institute_exams (exams offered by institute)
CREATE TABLE IF NOT EXISTS institute_exams (
  id SERIAL PRIMARY KEY,
  institute_id INTEGER NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institute_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_institute_exams_institute_id ON institute_exams(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_exams_exam_id ON institute_exams(exam_id);

-- 4. institute_exam_specialization
CREATE TABLE IF NOT EXISTS institute_exam_specialization (
  id SERIAL PRIMARY KEY,
  institute_id INTEGER NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams_taxonomies(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institute_id, exam_id)
);

CREATE INDEX IF NOT EXISTS idx_institute_exam_specialization_institute_id ON institute_exam_specialization(institute_id);
CREATE INDEX IF NOT EXISTS idx_institute_exam_specialization_exam_id ON institute_exam_specialization(exam_id);

-- 5. institute_statistics (one row per institute)
CREATE TABLE IF NOT EXISTS institute_statistics (
  id SERIAL PRIMARY KEY,
  institute_id INTEGER NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  ranking_score DECIMAL(5, 2),
  success_rate DECIMAL(5, 2),
  student_rating DECIMAL(3, 2),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(institute_id)
);

CREATE INDEX IF NOT EXISTS idx_institute_statistics_institute_id ON institute_statistics(institute_id);

DROP TRIGGER IF EXISTS update_institute_statistics_updated_at ON institute_statistics;
CREATE TRIGGER update_institute_statistics_updated_at BEFORE UPDATE ON institute_statistics
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. institute_courses
CREATE TABLE IF NOT EXISTS institute_courses (
  id SERIAL PRIMARY KEY,
  institute_id INTEGER NOT NULL REFERENCES institutes(id) ON DELETE CASCADE,
  course_name VARCHAR(255),
  target_class VARCHAR(100),
  duration_months INTEGER,
  fees DECIMAL(12, 2),
  batch_size INTEGER,
  start_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institute_courses_institute_id ON institute_courses(institute_id);

COMMENT ON TABLE institutes IS 'Coaching/institute main information';
COMMENT ON TABLE institute_details IS 'Institute description and flags (demo, scholarship)';
COMMENT ON TABLE institute_exams IS 'Exams offered by institute';
COMMENT ON TABLE institute_exam_specialization IS 'Exam specializations of institute';
COMMENT ON TABLE institute_statistics IS 'Ranking, success rate, rating per institute';
COMMENT ON TABLE institute_courses IS 'Courses offered by institute';
