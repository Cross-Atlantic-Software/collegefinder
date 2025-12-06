-- Add onboarding_completed flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Set existing users with name to have completed onboarding
UPDATE users SET onboarding_completed = TRUE WHERE name IS NOT NULL AND name != '';

