-- Government Identification Table
-- Stores user government ID information (Aadhar, APAAR ID)

CREATE TABLE IF NOT EXISTS government_identification (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  aadhar_number VARCHAR(20),
  apaar_id VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_government_identification_user_id ON government_identification(user_id);
CREATE INDEX IF NOT EXISTS idx_government_identification_apaar_id ON government_identification(apaar_id);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_government_identification_updated_at ON government_identification;
CREATE TRIGGER update_government_identification_updated_at BEFORE UPDATE ON government_identification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE government_identification IS 'Stores user government identification details';
COMMENT ON COLUMN government_identification.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN government_identification.aadhar_number IS 'Aadhar card number (12 digits)';
COMMENT ON COLUMN government_identification.apaar_id IS 'APAAR (Academic Bank of Credits) ID';
