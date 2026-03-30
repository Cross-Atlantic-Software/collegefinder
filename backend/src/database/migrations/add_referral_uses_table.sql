CREATE TABLE IF NOT EXISTS referral_uses (
  id             SERIAL PRIMARY KEY,
  referral_code  VARCHAR(20)  NOT NULL,
  used_by_user_id INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_by_email  TEXT         NOT NULL,
  used_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(referral_code, used_by_user_id)
);

CREATE INDEX IF NOT EXISTS idx_referral_uses_code ON referral_uses(referral_code);
CREATE INDEX IF NOT EXISTS idx_referral_uses_user ON referral_uses(used_by_user_id);
