-- Add optional diagram/image URL for questions (e.g. JEE Main Physics diagram-based questions)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);
COMMENT ON COLUMN questions.image_url IS 'Optional URL to diagram/figure image for the question';
