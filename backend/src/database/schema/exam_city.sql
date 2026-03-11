-- Exam City Table
-- Stores exam cities for user preferences
CREATE TABLE IF NOT EXISTS exam_city (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exam_city') THEN
    ALTER TABLE exam_city ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE exam_city ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE exam_city ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE exam_city ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_exam_city_name ON exam_city(name);
CREATE INDEX IF NOT EXISTS idx_exam_city_status ON exam_city(status);

-- Trigger to automatically update updated_at for exam_city
DROP TRIGGER IF EXISTS update_exam_city_updated_at ON exam_city;
CREATE TRIGGER update_exam_city_updated_at BEFORE UPDATE ON exam_city
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE exam_city IS 'Exam cities table - cities where exams can be conducted';
COMMENT ON COLUMN exam_city.name IS 'Display name for the exam city';
COMMENT ON COLUMN exam_city.status IS 'Active status of the exam city (true = active, false = inactive)';


