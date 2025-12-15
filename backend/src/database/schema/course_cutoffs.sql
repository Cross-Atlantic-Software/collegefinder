-- Course Cutoffs Table
-- Stores cutoff information for course exams
CREATE TABLE IF NOT EXISTS course_cutoffs (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES college_courses(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES course_exams(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  cutoff_value DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_cutoffs') THEN
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS course_id INTEGER REFERENCES college_courses(id) ON DELETE CASCADE;
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS exam_id INTEGER REFERENCES course_exams(id) ON DELETE CASCADE;
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS year INTEGER;
    -- Migrate from category VARCHAR to category_id INTEGER if category column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'course_cutoffs' AND column_name = 'category' AND data_type = 'character varying') THEN
      -- Add category_id column if it doesn't exist
      ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
      -- Note: Manual migration of existing category text values to category_id would be needed
      -- For now, we'll keep both columns during migration period
    ELSE
      ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
    END IF;
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS cutoff_value DECIMAL(10, 2);
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE course_cutoffs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_course_cutoffs_course_id ON course_cutoffs(course_id);
CREATE INDEX IF NOT EXISTS idx_course_cutoffs_exam_id ON course_cutoffs(exam_id);
CREATE INDEX IF NOT EXISTS idx_course_cutoffs_year ON course_cutoffs(year);

-- Trigger
DROP TRIGGER IF EXISTS update_course_cutoffs_updated_at ON course_cutoffs;
CREATE TRIGGER update_course_cutoffs_updated_at BEFORE UPDATE ON course_cutoffs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE course_cutoffs IS 'Course cutoffs table - stores cutoff information for course exams';
COMMENT ON COLUMN course_cutoffs.course_id IS 'Foreign key reference to college_courses table';
COMMENT ON COLUMN course_cutoffs.exam_id IS 'Foreign key reference to course_exams table';
COMMENT ON COLUMN course_cutoffs.year IS 'Year of the cutoff';
COMMENT ON COLUMN course_cutoffs.category_id IS 'Foreign key reference to categories table';
COMMENT ON COLUMN course_cutoffs.cutoff_value IS 'Cutoff value/rank';

