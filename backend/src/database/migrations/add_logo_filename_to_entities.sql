-- Add logo_filename to entities for matching when uploading missing logos from ZIP
-- Same pattern as exams_taxonomies.logo_file_name

-- career_goals_taxonomies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'career_goals_taxonomies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'career_goals_taxonomies' AND column_name = 'logo_filename'
    ) THEN
      ALTER TABLE career_goals_taxonomies ADD COLUMN logo_filename VARCHAR(255);
    END IF;
  END IF;
END $$;

-- institutes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'institutes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'institutes' AND column_name = 'logo_filename'
    ) THEN
      ALTER TABLE institutes ADD COLUMN logo_filename VARCHAR(255);
    END IF;
  END IF;
END $$;

-- colleges (table name may vary - check schema)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'colleges') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'colleges' AND column_name = 'logo_filename'
    ) THEN
      ALTER TABLE colleges ADD COLUMN logo_filename VARCHAR(255);
    END IF;
  END IF;
END $$;

-- loan_providers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'loan_providers') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'loan_providers' AND column_name = 'logo_filename'
    ) THEN
      ALTER TABLE loan_providers ADD COLUMN logo_filename VARCHAR(255);
    END IF;
  END IF;
END $$;
