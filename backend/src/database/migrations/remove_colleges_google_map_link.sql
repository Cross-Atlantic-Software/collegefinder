-- Remove Places API–derived map link from colleges (feature retired).
ALTER TABLE colleges DROP COLUMN IF EXISTS google_map_link;
