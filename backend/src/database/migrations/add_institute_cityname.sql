-- Add institute_cityname column to institutes table (unique identifier per coaching row)
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS institute_cityname VARCHAR(500);

-- Create unique index on institute_cityname (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_institutes_cityname_unique
  ON institutes (LOWER(institute_cityname))
  WHERE institute_cityname IS NOT NULL AND TRIM(institute_cityname) <> '';
