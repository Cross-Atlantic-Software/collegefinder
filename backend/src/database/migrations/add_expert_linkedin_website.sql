-- LinkedIn and website URLs for admission experts (admin-managed)
ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE admission_experts ADD COLUMN IF NOT EXISTS website VARCHAR(500);
