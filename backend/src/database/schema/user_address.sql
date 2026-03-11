-- User Address Table
-- Stores user correspondence and permanent address information

CREATE TABLE IF NOT EXISTS user_address (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  correspondence_address_line1 VARCHAR(500),
  correspondence_address_line2 VARCHAR(500),
  city_town_village VARCHAR(255),
  district VARCHAR(255),
  state VARCHAR(255),
  country VARCHAR(100) DEFAULT 'India',
  pincode VARCHAR(20),
  permanent_address_same_as_correspondence BOOLEAN DEFAULT false,
  permanent_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Indexes for user_address table
CREATE INDEX IF NOT EXISTS idx_user_address_user_id ON user_address(user_id);
CREATE INDEX IF NOT EXISTS idx_user_address_state ON user_address(state);
CREATE INDEX IF NOT EXISTS idx_user_address_district ON user_address(district);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_address_updated_at ON user_address;
CREATE TRIGGER update_user_address_updated_at BEFORE UPDATE ON user_address
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_address IS 'Stores user address information for correspondence and permanent addresses';
COMMENT ON COLUMN user_address.user_id IS 'Foreign key reference to users table';
COMMENT ON COLUMN user_address.correspondence_address_line1 IS 'First line of correspondence address';
COMMENT ON COLUMN user_address.correspondence_address_line2 IS 'Second line of correspondence address';
COMMENT ON COLUMN user_address.city_town_village IS 'City, town, or village name';
COMMENT ON COLUMN user_address.district IS 'District name';
COMMENT ON COLUMN user_address.state IS 'State name';
COMMENT ON COLUMN user_address.country IS 'Country name, defaults to India';
COMMENT ON COLUMN user_address.pincode IS 'Postal/ZIP code';
COMMENT ON COLUMN user_address.permanent_address_same_as_correspondence IS 'Whether permanent address is same as correspondence';
COMMENT ON COLUMN user_address.permanent_address IS 'Full permanent address if different from correspondence';
