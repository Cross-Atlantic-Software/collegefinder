-- Course Exams Table
-- Stores exam information for courses
CREATE TABLE IF NOT EXISTS course_exams (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES college_courses(id) ON DELETE CASCADE,
  exam_name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_exams') THEN
    ALTER TABLE course_exams ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES college_courses(id) ON DELETE CASCADE;
    ALTER TABLE course_exams ADD COLUMN IF NOT EXISTS exam_name VARCHAR(255);
    ALTER TABLE course_exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE course_exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_exams_course_id ON course_exams(course_id);
CREATE INDEX IF NOT EXISTS idx_course_exams_exam_name ON course_exams(exam_name);

-- Trigger
DROP TRIGGER IF EXISTS update_course_exams_updated_at ON course_exams;
CREATE TRIGGER update_course_exams_updated_at BEFORE UPDATE ON course_exams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE course_exams IS 'Course exams table - stores exam information for courses';
COMMENT ON COLUMN course_exams.course_id IS 'Foreign key reference to college_courses table';
COMMENT ON COLUMN course_exams.exam_name IS 'Name of the exam';

