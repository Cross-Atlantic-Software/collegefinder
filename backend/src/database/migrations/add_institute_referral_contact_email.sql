-- Comma/space/semicolon-separated emails for referral invite (admin sends via server).
ALTER TABLE institutes ADD COLUMN IF NOT EXISTS referral_contact_email TEXT;
