-- Colleges: logo_filename (ZIP match) -> logo_url (image URL from Excel or external link)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_filename'
  ) THEN
    ALTER TABLE colleges RENAME COLUMN logo_filename TO logo_url;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE colleges ALTER COLUMN logo_url TYPE VARCHAR(2000);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'colleges' AND column_name = 'logo_url'
  ) THEN
    EXECUTE $c$COMMENT ON COLUMN colleges.logo_url IS 'External or spreadsheet logo image URL; null when college_logo is S3-hosted only.'$c$;
  END IF;
END $$;
