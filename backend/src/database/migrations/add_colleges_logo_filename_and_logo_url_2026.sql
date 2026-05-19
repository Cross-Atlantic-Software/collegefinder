-- Colleges: keep logo_filename (ZIP / spreadsheet match) and logo_url (direct image URL) as separate columns.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE colleges ADD COLUMN logo_url VARCHAR(2000);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_filename'
  ) THEN
    ALTER TABLE colleges ADD COLUMN logo_filename VARCHAR(255);
  END IF;
END $$;

COMMENT ON COLUMN colleges.logo_url IS 'External or spreadsheet direct image URL.';
COMMENT ON COLUMN colleges.logo_filename IS 'Logo file name for ZIP bulk upload matching; college_logo holds S3 URL after upload.';
