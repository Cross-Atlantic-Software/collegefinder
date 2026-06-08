-- Exams Taxonomies Table
-- Stores the available exam options that can be selected by users
CREATE TABLE IF NOT EXISTS exams_taxonomies (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50), -- Optional short code (e.g. JEE_MAIN, NEET); unique when set
  description TEXT,
  exam_logo VARCHAR(500),
  exam_type VARCHAR(255),
  conducting_authority VARCHAR(255),
  logo_file_name VARCHAR(255),
  number_of_papers INTEGER NOT NULL DEFAULT 1,
  website VARCHAR(500),
  registration_link VARCHAR(500),
  documents_required TEXT,
  counselling TEXT,
  generation_prompt TEXT,
  total_mocks_generated INTEGER DEFAULT 0,
  exam_popularity_rank INTEGER,
  difficulty_level VARCHAR(50),
  shortlist_meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT exams_taxonomies_difficulty_level_check CHECK (
    difficulty_level IS NULL
    OR difficulty_level IN ('Advanced', 'Intermediate', 'Intermediate - advanced')
  )
);

-- Backfill columns on older databases
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS code VARCHAR(50);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS description TEXT;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_logo VARCHAR(500);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_type VARCHAR(255);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS conducting_authority VARCHAR(255);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS logo_file_name VARCHAR(255);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS number_of_papers INTEGER NOT NULL DEFAULT 1;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS website VARCHAR(500);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS registration_link VARCHAR(500);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS documents_required TEXT;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS counselling TEXT;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS generation_prompt TEXT;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS total_mocks_generated INTEGER DEFAULT 0;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS exam_popularity_rank INTEGER;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(50);
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS shortlist_meta JSONB DEFAULT '{}'::jsonb;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Unique name; partial unique on non-empty code (matches restructure migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'exams_taxonomies_name_key'
  ) THEN
    ALTER TABLE exams_taxonomies ADD CONSTRAINT exams_taxonomies_name_key UNIQUE (name);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_exams_taxonomies_code_unique
  ON exams_taxonomies (code) WHERE code IS NOT NULL AND trim(code) <> '';

CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_name ON exams_taxonomies(name);
CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_code ON exams_taxonomies(code);
CREATE INDEX IF NOT EXISTS idx_exams_taxonomies_exam_popularity_rank ON exams_taxonomies(exam_popularity_rank);

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
COMMENT ON COLUMN exams_taxonomies.code IS 'Optional short code for the exam (e.g., JEE_MAIN, NEET, CUET)';
COMMENT ON COLUMN exams_taxonomies.description IS 'Description of the exam';

-- Related tables: exam_dates, exam_eligibility_criteria, exam_pattern, exam_cutoff (add_exam_fields_and_related_tables.sql)
