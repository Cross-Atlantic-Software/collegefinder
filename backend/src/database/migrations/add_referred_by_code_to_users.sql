-- Code someone else shared with this user (distinct from users.referral_code — their own share code).
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(32);

COMMENT ON COLUMN users.referred_by_code IS 'Referral code this user used at signup or in profile (who referred them). Not the same as referral_code (their own code for Refer & Earn).';
