-- Scholarships: single stream_id -> stream_ids INTEGER[] (multi-select)
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS stream_ids INTEGER[] DEFAULT '{}';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scholarships' AND column_name = 'stream_id'
  ) THEN
    UPDATE scholarships
    SET stream_ids = ARRAY[stream_id]
    WHERE stream_id IS NOT NULL
      AND (stream_ids IS NULL OR stream_ids = '{}');

    DROP INDEX IF EXISTS idx_scholarships_stream_id;
    ALTER TABLE scholarships DROP COLUMN stream_id;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_scholarships_stream_ids ON scholarships USING GIN (stream_ids);
