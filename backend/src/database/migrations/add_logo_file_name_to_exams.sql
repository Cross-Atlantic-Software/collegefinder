-- Add logo_file_name to exams_taxonomies for matching missing logos later
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exams_taxonomies') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'exams_taxonomies' AND column_name = 'logo_file_name'
    ) THEN
      ALTER TABLE exams_taxonomies ADD COLUMN logo_file_name VARCHAR(255);
    END IF;
  END IF;
END $$;

COMMENT ON COLUMN exams_taxonomies.logo_file_name IS 'Original logo filename from Excel; used to match when uploading missing logos later';
