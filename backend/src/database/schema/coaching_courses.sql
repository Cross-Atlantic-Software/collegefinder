-- Coaching Courses Table
-- Stores course information for coaching centers
CREATE TABLE IF NOT EXISTS coaching_courses (
  id SERIAL PRIMARY KEY,
  coaching_id INTEGER NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  exam_ids INTEGER[], -- Array of exam IDs from exams_taxonomies table
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  duration VARCHAR(100),
  mode VARCHAR(50) DEFAULT 'Online', -- 'Online', 'Offline', or 'Hybrid'
  fee DECIMAL(10, 2),
  contact_email VARCHAR(255),
  contact VARCHAR(100), -- Phone number
  rating DECIMAL(3, 2), -- Rating from 0.00 to 5.00
  features TEXT[], -- Array of feature strings
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coaching_courses') THEN
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS coaching_id INTEGER REFERENCES coachings(id) ON DELETE CASCADE;
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS exam_ids INTEGER[];
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS title VARCHAR(255);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS summary TEXT;
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS duration VARCHAR(100);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'Online';
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS fee DECIMAL(10, 2);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS contact VARCHAR(100);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS rating DECIMAL(3, 2);
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS features TEXT[];
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE coaching_courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_courses_coaching_id ON coaching_courses(coaching_id);
CREATE INDEX IF NOT EXISTS idx_coaching_courses_title ON coaching_courses(title);
CREATE INDEX IF NOT EXISTS idx_coaching_courses_mode ON coaching_courses(mode);
CREATE INDEX IF NOT EXISTS idx_coaching_courses_rating ON coaching_courses(rating);

-- Trigger to automatically update updated_at for coaching_courses
DROP TRIGGER IF EXISTS update_coaching_courses_updated_at ON coaching_courses;
CREATE TRIGGER update_coaching_courses_updated_at BEFORE UPDATE ON coaching_courses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coaching_courses IS 'Coaching courses table - stores course information for coaching centers';
COMMENT ON COLUMN coaching_courses.coaching_id IS 'Foreign key reference to coachings table';
COMMENT ON COLUMN coaching_courses.exam_ids IS 'Array of exam IDs from exams_taxonomies table';
COMMENT ON COLUMN coaching_courses.title IS 'Course title';
COMMENT ON COLUMN coaching_courses.summary IS 'Course summary';
COMMENT ON COLUMN coaching_courses.duration IS 'Course duration';
COMMENT ON COLUMN coaching_courses.mode IS 'Course mode: Online, Offline, or Hybrid';
COMMENT ON COLUMN coaching_courses.fee IS 'Course fee';
COMMENT ON COLUMN coaching_courses.contact_email IS 'Contact email for the course';
COMMENT ON COLUMN coaching_courses.contact IS 'Contact phone number for the course';
COMMENT ON COLUMN coaching_courses.rating IS 'Course rating from 0.00 to 5.00';
COMMENT ON COLUMN coaching_courses.features IS 'Array of course features';
