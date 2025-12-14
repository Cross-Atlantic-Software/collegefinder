-- College Reviews Table
-- Stores user reviews for colleges
CREATE TABLE IF NOT EXISTS college_reviews (
  id SERIAL PRIMARY KEY,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'college_reviews') THEN
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE CASCADE;
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS review_text TEXT;
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE;
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE college_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_college_reviews_college_id ON college_reviews(college_id);
CREATE INDEX IF NOT EXISTS idx_college_reviews_user_id ON college_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_college_reviews_is_approved ON college_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_college_reviews_rating ON college_reviews(rating);

-- Trigger to automatically update updated_at for college_reviews
DROP TRIGGER IF EXISTS update_college_reviews_updated_at ON college_reviews;
CREATE TRIGGER update_college_reviews_updated_at BEFORE UPDATE ON college_reviews
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE college_reviews IS 'College reviews table - stores user reviews for colleges';
COMMENT ON COLUMN college_reviews.college_id IS 'Foreign key reference to colleges table';
COMMENT ON COLUMN college_reviews.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN college_reviews.rating IS 'Rating from 1 to 5';
COMMENT ON COLUMN college_reviews.review_text IS 'Text content of the review';
COMMENT ON COLUMN college_reviews.is_approved IS 'Whether the review has been approved by admin';

