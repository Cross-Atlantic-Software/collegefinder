-- College Gallery Table
-- Stores gallery images for colleges
CREATE TABLE IF NOT EXISTS college_gallery (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_gallery') THEN
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS caption VARCHAR(500);
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_gallery ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_gallery_college_id ON college_gallery(college_id);
CREATE INDEX IF NOT EXISTS idx_college_gallery_sort_order ON college_gallery(sort_order);

-- Trigger to automatically update updated_at for college_gallery
DROP TRIGGER IF EXISTS update_college_gallery_updated_at ON college_gallery;
CREATE TRIGGER update_college_gallery_updated_at BEFORE UPDATE ON college_gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_gallery IS 'College gallery table - stores gallery images for colleges';
COMMENT ON COLUMN college_gallery.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_gallery.image_url IS 'URL/path to the gallery image';
COMMENT ON COLUMN college_gallery.caption IS 'Optional caption for the image';
COMMENT ON COLUMN college_gallery.sort_order IS 'Display order for sorting images';

