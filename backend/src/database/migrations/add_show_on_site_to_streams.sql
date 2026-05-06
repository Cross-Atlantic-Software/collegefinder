ALTER TABLE streams
  ADD COLUMN IF NOT EXISTS show_on_site BOOLEAN DEFAULT TRUE;

UPDATE streams
SET show_on_site = TRUE
WHERE show_on_site IS NULL;

CREATE INDEX IF NOT EXISTS idx_streams_show_on_site ON streams(show_on_site);
