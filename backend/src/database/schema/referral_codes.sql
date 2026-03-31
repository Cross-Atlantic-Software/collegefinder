-- Referral Codes Schema
-- Adds referral_code column to users and institutes tables

-- Add referral_code to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);

-- Add referral_code to institutes
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20);

-- Unique indexes (partial — only index non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_referral_code
  ON users(referral_code) WHERE referral_code IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_institutes_referral_code
  ON institutes(referral_code) WHERE referral_code IS NOT NULL;
