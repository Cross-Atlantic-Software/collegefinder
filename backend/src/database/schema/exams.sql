-- Exams Taxonomies Table
-- Stores the available exam options that can be selected by users
CREATE TABLE IF NOT EXISTS exams_taxonomies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL, -- Short code like JEE_MAIN, NEET, etc.
  description TEXT,
  format JSONB DEFAULT '{}'::jsonb, -- Format configuration including papers, sections, marking scheme
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

-- Seed default exams (name, code, description). Run `npm run seed-exams` for full format configs (JEE Main, NEET, etc.)
INSERT INTO exams_taxonomies (name, code, description, format) VALUES
  ('JEE Main', 'JEE_MAIN', 'Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges', '{}'::jsonb),
  ('JEE Advanced', 'JEE_ADVANCED', 'Joint Entrance Examination Advanced - for admission to IITs', '{}'::jsonb),
  ('NEET', 'NEET', 'National Eligibility cum Entrance Test - for admission to medical and dental colleges', '{}'::jsonb),
  ('CUET', 'CUET', 'Common University Entrance Test - for admission to central universities', '{}'::jsonb),
  ('CLAT', 'CLAT', 'Common Law Admission Test - for admission to NLUs and other law colleges', '{}'::jsonb),
  ('AILET', 'AILET', 'All India Law Entrance Test - for admission to NLU Delhi', '{}'::jsonb),
  ('NATA', 'NATA', 'National Aptitude Test in Architecture - for admission to architecture colleges', '{}'::jsonb),
  ('BITSAT', 'BITSAT', 'Birla Institute of Technology and Science Admission Test', '{}'::jsonb),
  ('VITEEE', 'VITEEE', 'VIT Engineering Entrance Examination', '{}'::jsonb),
  ('SRMJEEE', 'SRMJEEE', 'SRM Joint Engineering Entrance Examination', '{}'::jsonb),
  ('WBJEE', 'WBJEE', 'West Bengal Joint Entrance Examination', '{}'::jsonb),
  ('MHT CET', 'MHT_CET', 'Maharashtra Common Entrance Test', '{}'::jsonb),
  ('KCET', 'KCET', 'Karnataka Common Entrance Test', '{}'::jsonb),
  ('TNEA', 'TNEA', 'Tamil Nadu Engineering Admission', '{}'::jsonb),
  ('AP EAMCET', 'AP_EAMCET', 'Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test', '{}'::jsonb),
  ('TS EAMCET', 'TS_EAMCET', 'Telangana State Engineering, Agriculture and Medical Common Entrance Test', '{}'::jsonb),
  ('Gujarat CET', 'GUJCET', 'Gujarat Common Entrance Test', '{}'::jsonb),
  ('Rajasthan JEE', 'RJEE', 'Rajasthan Joint Entrance Examination', '{}'::jsonb),
  ('UPSEE', 'UPSEE', 'Uttar Pradesh State Entrance Examination', '{}'::jsonb),
  ('COMEDK', 'COMEDK', 'Consortium of Medical, Engineering and Dental Colleges of Karnataka', '{}'::jsonb),
  ('KIITEE', 'KIITEE', 'KIIT Entrance Examination', '{}'::jsonb),
  ('JIPMER', 'JIPMER', 'Jawaharlal Institute of Postgraduate Medical Education and Research Entrance Exam', '{}'::jsonb),
  ('AIIMS', 'AIIMS', 'All India Institute of Medical Sciences Entrance Exam', '{}'::jsonb),
  ('NEST', 'NEST', 'National Entrance Screening Test - for admission to NISER and CEBS', '{}'::jsonb),
  ('IISER Aptitude Test', 'IISER_APTITUDE', 'Indian Institutes of Science Education and Research Aptitude Test', '{}'::jsonb)
ON CONFLICT (code) DO NOTHING;
