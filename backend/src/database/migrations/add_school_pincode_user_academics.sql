-- Add school PIN codes for 10th / 12th on user_academics (idempotent)
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS matric_school_pincode VARCHAR(10);
ALTER TABLE user_academics ADD COLUMN IF NOT EXISTS postmatric_school_pincode VARCHAR(10);
