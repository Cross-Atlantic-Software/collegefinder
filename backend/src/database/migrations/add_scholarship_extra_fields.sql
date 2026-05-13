-- Add new fields to scholarships table
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS official_notification_link VARCHAR(500);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS application_link VARCHAR(500);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS active_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS academic_year VARCHAR(50);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS eligible_degree VARCHAR(500);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS number_of_awards VARCHAR(255);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS renewal_available BOOLEAN DEFAULT FALSE;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS renewal_conditions TEXT;
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS scope VARCHAR(100);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS value_category VARCHAR(100);
ALTER TABLE scholarships ADD COLUMN IF NOT EXISTS education_level VARCHAR(255);
