-- Remove legacy lectures.name and switch uniqueness to youtube_title per subtopic.

-- Best effort drop of old uniqueness/index.
ALTER TABLE lectures DROP CONSTRAINT IF EXISTS lectures_subtopic_id_name_key;
DROP INDEX IF EXISTS idx_lectures_name;

-- Drop old display-name column if present.
ALTER TABLE lectures DROP COLUMN IF EXISTS name;

-- Add youtube title search index.
CREATE INDEX IF NOT EXISTS idx_lectures_youtube_title ON lectures(youtube_title);

-- Try to enforce uniqueness for non-empty youtube titles per subtopic.
-- If existing duplicate data prevents index creation, keep app-level validation only.
DO $$
BEGIN
  BEGIN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_lectures_subtopic_youtube_title_nonempty
      ON lectures (subtopic_id, LOWER(TRIM(youtube_title)))
      WHERE youtube_title IS NOT NULL AND TRIM(youtube_title) <> '';
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Skipping unique index uq_lectures_subtopic_youtube_title_nonempty due to duplicate existing data.';
    WHEN others THEN
      RAISE NOTICE 'Could not create uq_lectures_subtopic_youtube_title_nonempty: %', SQLERRM;
  END;
END $$;
