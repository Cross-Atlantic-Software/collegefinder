-- Course Subjects Table
-- Stores subject associations for courses
CREATE TABLE IF NOT EXISTS course_subjects (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES college_courses(id) ON DELETE CASCADE,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(course_id, subject_id)
);

-- Ensure columns exist on older databases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_subjects') THEN
    ALTER TABLE course_subjects ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES college_courses(id) ON DELETE CASCADE;
    ALTER TABLE course_subjects ADD COLUMN IF NOT EXISTS subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE;
    ALTER TABLE course_subjects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE course_subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_subjects_course_id ON course_subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_course_subjects_subject_id ON course_subjects(subject_id);

-- Trigger
DROP TRIGGER IF EXISTS update_course_subjects_updated_at ON course_subjects;
CREATE TRIGGER update_course_subjects_updated_at BEFORE UPDATE ON course_subjects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE course_subjects IS 'Course subjects table - stores subject associations for courses';
COMMENT ON COLUMN course_subjects.course_id IS 'Foreign key reference to college_courses table';
COMMENT ON COLUMN course_subjects.subject_id IS 'Foreign key reference to subjects table';

