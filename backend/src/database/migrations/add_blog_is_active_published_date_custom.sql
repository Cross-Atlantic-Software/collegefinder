-- Blog visibility and optional display date for the public site
ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE college_finder_blogs ADD COLUMN IF NOT EXISTS published_date_custom DATE;

COMMENT ON COLUMN college_finder_blogs.is_active IS 'When false, blog is hidden from the public site but still manageable in admin';
COMMENT ON COLUMN college_finder_blogs.published_date_custom IS 'Optional date shown on the public blog post; if null, created_at is used';

CREATE INDEX IF NOT EXISTS idx_blogs_is_active ON college_finder_blogs(is_active);
