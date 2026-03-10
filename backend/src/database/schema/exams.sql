-- Exams Taxonomies Table
-- Stores the available exam options that can be selected by users
CREATE TABLE IF NOT EXISTS exams_taxonomies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL, -- Short code like JEE_MAIN, NEET, etc.
  description TEXT,
  format JSONB DEFAULT '{}'::jsonb, -- Format configuration including papers, sections, marking scheme
  generation_prompt TEXT, -- Optional exam-specific prompt for question generation; if set, used instead of generic prompt
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(name),
  UNIQUE(code)
);

-- Ensure format column exists on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS format JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
  END IF;
END $$;

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
COMMENT ON COLUMN exams_taxonomies.format IS 'JSONB format configuration including papers, sections, question distribution, marking scheme, and rules';

-- Seed only JEE Main so the app works out of the box. No bulk seed — prevents re-adding 25 exams on every schema load.
-- To add more exams later, run: npm run seed-exams (or use admin/API). To keep only JEE: npm run keep-only-jee-exams.
INSERT INTO exams_taxonomies (name, code, description, format) VALUES
  ('JEE Main', 'JEE_MAIN', 'Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges', '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;
