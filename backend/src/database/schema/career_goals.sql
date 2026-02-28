-- Career Goals Taxonomies Table
-- Stores the available career goal options that can be selected by users
CREATE TABLE IF NOT EXISTS career_goals_taxonomies (
  id SERIAL PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  logo VARCHAR(500) NOT NULL, -- S3 URL
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(label)
);

-- Create index on label for faster searches
CREATE INDEX IF NOT EXISTS idx_career_goals_taxonomies_label ON career_goals_taxonomies(label);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_career_goals_taxonomies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_career_goals_taxonomies_updated_at ON career_goals_taxonomies;
CREATE TRIGGER trigger_update_career_goals_taxonomies_updated_at
  BEFORE UPDATE ON career_goals_taxonomies
  FOR EACH ROW
  EXECUTE FUNCTION update_career_goals_taxonomies_updated_at();

COMMENT ON TABLE career_goals_taxonomies IS 'Taxonomy table for career goal options (interests) that users can select';
COMMENT ON COLUMN career_goals_taxonomies.label IS 'Display label for the career goal option (e.g., Technology, Design)';
COMMENT ON COLUMN career_goals_taxonomies.logo IS 'S3 URL for the career goal logo/image';

-- Seed default interests (career goals) - safe to run multiple times
INSERT INTO career_goals_taxonomies (label, logo) VALUES
  ('Technology', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
  ('Engineering', 'https://cdn-icons-png.flaticon.com/512/2103/2103633.png'),
  ('Medicine', 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png'),
  ('Business', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'),
  ('Design', 'https://cdn-icons-png.flaticon.com/512/1055/1055687.png'),
  ('Arts', 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'),
  ('Science', 'https://cdn-icons-png.flaticon.com/512/3135/3135804.png'),
  ('Law', 'https://cdn-icons-png.flaticon.com/512/3135/3135810.png'),
  ('Education', 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png'),
  ('Finance', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'),
  ('Marketing', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'),
  ('Healthcare', 'https://cdn-icons-png.flaticon.com/512/2965/2965879.png'),
  ('Architecture', 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'),
  ('Agriculture', 'https://cdn-icons-png.flaticon.com/512/3135/3135804.png'),
  ('Sports', 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png'),
  ('Media', 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'),
  ('Hospitality', 'https://cdn-icons-png.flaticon.com/512/3135/3135789.png'),
  ('Social Work', 'https://cdn-icons-png.flaticon.com/512/3135/3135807.png')
ON CONFLICT (label) DO NOTHING;
