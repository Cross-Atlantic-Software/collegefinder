-- Exams Taxonomies Table
-- Stores the available exam options that can be selected by users
CREATE TABLE IF NOT EXISTS exams_taxonomies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL, -- Short code like JEE_MAIN, NEET, etc.
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name),
  UNIQUE(code)
);

-- Create index on name and code for faster searches
CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_name ON exams_taxonomies(name);
CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_code ON exams_taxonomies(code);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_exams_taxonomies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_exams_taxonomies_updated_at ON exams_taxonomies;
CREATE TRIGGER trigger_update_exams_taxonomies_updated_at
  BEFORE UPDATE ON exams_taxonomies
  FOR EACH ROW
  EXECUTE FUNCTION update_exams_taxonomies_updated_at();

COMMENT ON TABLE exams_taxonomies IS 'Taxonomy table for exam options that users can select (JEE Main, NEET, CUET, etc.)';
COMMENT ON COLUMN exams_taxonomies.name IS 'Display name for the exam (e.g., JEE Main, NEET, CUET)';
COMMENT ON COLUMN exams_taxonomies.code IS 'Short code for the exam (e.g., JEE_MAIN, NEET, CUET)';
COMMENT ON COLUMN exams_taxonomies.description IS 'Description of the exam';

