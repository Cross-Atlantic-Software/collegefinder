-- Ensure colleges.logo_url exists (rename from logo_filename or add fresh).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_url'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_filename'
    ) THEN
      ALTER TABLE colleges RENAME COLUMN logo_filename TO logo_url;
    ELSE
      ALTER TABLE colleges ADD COLUMN logo_url VARCHAR(2000);
    END IF;
  END IF;
END $$;

ALTER TABLE colleges
  ALTER COLUMN logo_url TYPE VARCHAR(2000);

COMMENT ON COLUMN colleges.logo_url IS 'External or spreadsheet logo image URL; null when college_logo is S3-hosted only.';
