-- Other Personal Details Table
-- Stores additional personal information about users

CREATE TABLE IF NOT EXISTS other_personal_details (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  religion VARCHAR(100),
  mother_tongue VARCHAR(100),
  annual_family_income VARCHAR(100),
  occupation_of_father VARCHAR(255),
  occupation_of_mother VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_other_personal_details_user_id ON other_personal_details(user_id);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_other_personal_details_updated_at ON other_personal_details;
CREATE TRIGGER update_other_personal_details_updated_at BEFORE UPDATE ON other_personal_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE other_personal_details IS 'Stores additional personal details for users';
COMMENT ON COLUMN other_personal_details.religion IS 'User religion';
COMMENT ON COLUMN other_personal_details.mother_tongue IS 'User mother tongue/native language';
COMMENT ON COLUMN other_personal_details.annual_family_income IS 'Annual family income bracket';
COMMENT ON COLUMN other_personal_details.occupation_of_father IS 'Father occupation';
COMMENT ON COLUMN other_personal_details.occupation_of_mother IS 'Mother occupation';
