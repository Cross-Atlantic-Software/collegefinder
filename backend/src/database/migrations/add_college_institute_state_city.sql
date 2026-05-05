-- Structured location for colleges and institutes (admin: state + city/district).
-- college_location / institute_location remain as display line "City, State".

ALTER TABLE colleges ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS city VARCHAR(255);

ALTER TABLE institutes ADD COLUMN IF NOT EXISTS state VARCHAR(255);
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS city VARCHAR(255);

COMMENT ON COLUMN colleges.state IS 'Indian state name for location';
COMMENT ON COLUMN colleges.city IS 'City or district within state';
COMMENT ON COLUMN institutes.state IS 'Indian state name for location';
COMMENT ON COLUMN institutes.city IS 'City or district within state';
