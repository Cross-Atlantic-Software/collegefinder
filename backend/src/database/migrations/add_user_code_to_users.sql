-- Public-facing unique user reference: UT + 8 digits (e.g. UT12345678). Internal PK remains id.
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_code VARCHAR(12);

-- Backfill existing rows with unique codes (retry on collision)
DO $$
DECLARE
  r RECORD;
  new_code TEXT;
  attempt INT;
  updated INT;
BEGIN
  FOR r IN SELECT id FROM users WHERE user_code IS NULL OR TRIM(COALESCE(user_code, '')) = '' LOOP
    attempt := 0;
    updated := 0;
    WHILE updated = 0 AND attempt < 100 LOOP
      attempt := attempt + 1;
      new_code := 'UT' || LPAD((FLOOR(RANDOM() * 100000000))::BIGINT::TEXT, 8, '0');
      BEGIN
        UPDATE users SET user_code = new_code WHERE id = r.id;
        updated := 1;
      EXCEPTION
        WHEN unique_violation THEN
          NULL;
      END;
    END LOOP;
    IF updated = 0 THEN
      RAISE EXCEPTION 'Could not assign user_code for user id %', r.id;
    END IF;
  END LOOP;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code);

ALTER TABLE users ALTER COLUMN user_code SET NOT NULL;

COMMENT ON COLUMN users.user_code IS 'Client-facing reference (UT + 8 digits). Primary key remains id.';
