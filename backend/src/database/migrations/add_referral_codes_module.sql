INSERT INTO modules (name, code)
VALUES ('Active Referral Codes', 'referral_codes')
ON CONFLICT (code) DO NOTHING;
