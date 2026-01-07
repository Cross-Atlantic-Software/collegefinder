-- College Courses Table
-- Stores course information for colleges
CREATE TABLE IF NOT EXISTS college_courses (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL,
  level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL,
  program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  duration VARCHAR(100),
  curriculum_detail TEXT,
  admission_process TEXT,
  eligibility TEXT,
  placements TEXT,
  scholarship TEXT,
  brochure_url VARCHAR(500),
  fee_per_sem DECIMAL(10, 2),
  total_fee DECIMAL(10, 2),
  subject_ids INTEGER[], -- Array of subject IDs from subjects table
  exam_ids INTEGER[], -- Array of exam IDs from exams_taxonomies table
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_courses') THEN
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS level_id INTEGER REFERENCES levels(id) ON DELETE SET NULL;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS program_id INTEGER REFERENCES programs(id) ON DELETE SET NULL;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS curriculum_detail TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS admission_process TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS eligibility TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS placements TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS scholarship TEXT;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS brochure_url VARCHAR(500);
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS fee_per_sem DECIMAL(10, 2);
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS total_fee DECIMAL(10, 2);
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS subject_ids INTEGER[];
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS exam_ids INTEGER[];
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_courses_college_id ON college_courses(college_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_stream_id ON college_courses(stream_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_level_id ON college_courses(level_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_program_id ON college_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_college_courses_title ON college_courses(title);

-- Trigger to automatically update updated_at for college_courses
DROP TRIGGER IF EXISTS update_college_courses_updated_at ON college_courses;
CREATE TRIGGER update_college_courses_updated_at BEFORE UPDATE ON college_courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_courses IS 'College courses table - stores course information for colleges';
COMMENT ON COLUMN college_courses.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_courses.stream_id IS 'Foreign key reference to streams table';
COMMENT ON COLUMN college_courses.level_id IS 'Foreign key reference to levels table';
COMMENT ON COLUMN college_courses.program_id IS 'Foreign key reference to programs table';
COMMENT ON COLUMN college_courses.title IS 'Course title';
COMMENT ON COLUMN college_courses.summary IS 'Course summary';
COMMENT ON COLUMN college_courses.duration IS 'Course duration';
COMMENT ON COLUMN college_courses.curriculum_detail IS 'Detailed curriculum information';
COMMENT ON COLUMN college_courses.admission_process IS 'Admission process details';
COMMENT ON COLUMN college_courses.eligibility IS 'Eligibility criteria';
COMMENT ON COLUMN college_courses.placements IS 'Placement information';
COMMENT ON COLUMN college_courses.scholarship IS 'Scholarship information';
COMMENT ON COLUMN college_courses.brochure_url IS 'URL to course brochure PDF (S3)';
COMMENT ON COLUMN college_courses.fee_per_sem IS 'Fee per semester';
COMMENT ON COLUMN college_courses.total_fee IS 'Total course fee';
COMMENT ON COLUMN college_courses.subject_ids IS 'Array of subject IDs from subjects table';
COMMENT ON COLUMN college_courses.exam_ids IS 'Array of exam IDs from exams_taxonomies table';

