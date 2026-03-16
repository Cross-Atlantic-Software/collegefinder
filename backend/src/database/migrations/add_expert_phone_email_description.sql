-- Add phone, email, and description to admission_experts

ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS phone VARCHAR(255);
ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS description TEXT;
