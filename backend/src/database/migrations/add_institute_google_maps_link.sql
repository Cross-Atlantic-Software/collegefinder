-- Google Maps / Maps URL for institute location (admin + Excel bulk)
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS google_maps_link TEXT;
