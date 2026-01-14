-- Coaching Gallery Table
-- Stores gallery images for coaching centers
CREATE TABLE IF NOT EXISTS coaching_gallery (
  id SERIAL PRIMARY KEY,
  coaching_id INTEGER NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL, -- S3 URL/path for image
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coaching_gallery') THEN
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS coaching_id INTEGER REFERENCES coachings(id) ON DELETE CASCADE;
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS caption TEXT;
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE coaching_gallery ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coaching_gallery_coaching_id ON coaching_gallery(coaching_id);
CREATE INDEX IF NOT EXISTS idx_coaching_gallery_sort_order ON coaching_gallery(sort_order);

-- Trigger to automatically update updated_at for coaching_gallery
DROP TRIGGER IF EXISTS update_coaching_gallery_updated_at ON coaching_gallery;
CREATE TRIGGER update_coaching_gallery_updated_at BEFORE UPDATE ON coaching_gallery
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE coaching_gallery IS 'Coaching gallery table - stores images for coaching centers';
COMMENT ON COLUMN coaching_gallery.coaching_id IS 'Foreign key reference to coachings table';
COMMENT ON COLUMN coaching_gallery.image_url IS 'S3 URL/path for gallery image';
COMMENT ON COLUMN coaching_gallery.caption IS 'Optional caption for the image';
COMMENT ON COLUMN coaching_gallery.sort_order IS 'Display order for sorting gallery images';
