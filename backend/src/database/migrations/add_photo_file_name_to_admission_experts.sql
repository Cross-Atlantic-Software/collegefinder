-- Add photo_file_name to admission_experts for matching when uploading photos from ZIP (like logo_file_name for exams)
ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS photo_file_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_admission_experts_photo_file_name ON admission_experts(photo_file_name) WHERE photo_file_name IS NOT NULL;
