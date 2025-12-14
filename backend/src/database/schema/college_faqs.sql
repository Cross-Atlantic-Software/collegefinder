-- College FAQs Table
-- Stores frequently asked questions for colleges
CREATE TABLE IF NOT EXISTS college_faqs (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_faqs') THEN
    ALTER TABLE college_faqs ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_faqs ADD COLUMN IF NOT EXISTS question TEXT;
    ALTER TABLE college_faqs ADD COLUMN IF NOT EXISTS answer TEXT;
    ALTER TABLE college_faqs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_faqs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_faqs_college_id ON college_faqs(college_id);

-- Trigger
DROP TRIGGER IF EXISTS update_college_faqs_updated_at ON college_faqs;
CREATE TRIGGER update_college_faqs_updated_at BEFORE UPDATE ON college_faqs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_faqs IS 'College FAQs table - stores frequently asked questions for colleges';
COMMENT ON COLUMN college_faqs.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_faqs.question IS 'FAQ question';
COMMENT ON COLUMN college_faqs.answer IS 'FAQ answer';

