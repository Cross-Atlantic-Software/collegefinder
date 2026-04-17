-- Password reset via email link (forgot password flow)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(128);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_users_password_reset_token
  ON users(password_reset_token)
  WHERE password_reset_token IS NOT NULL;

COMMENT ON COLUMN users.password_reset_token IS 'Opaque token for password reset link - cleared after successful reset';
COMMENT ON COLUMN users.password_reset_expires IS 'When the reset token stops being valid.';
