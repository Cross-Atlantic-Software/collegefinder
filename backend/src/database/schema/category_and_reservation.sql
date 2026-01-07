-- Category and Reservation Table
-- Stores user category and reservation details
CREATE TABLE IF NOT EXISTS category_and_reservation (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  ews_status BOOLEAN DEFAULT FALSE,
  pwbd_status BOOLEAN DEFAULT FALSE,
  type_of_disability VARCHAR(255),
  disability_percentage DECIMAL(5, 2),
  udid_number VARCHAR(50),
  minority_status VARCHAR(100),
  ex_serviceman_defence_quota BOOLEAN DEFAULT FALSE,
  kashmiri_migrant_regional_quota BOOLEAN DEFAULT FALSE,
  state_domicile BOOLEAN DEFAULT FALSE,
  home_state_for_quota VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id)
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_and_reservation') THEN
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS ews_status BOOLEAN DEFAULT FALSE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS pwbd_status BOOLEAN DEFAULT FALSE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS type_of_disability VARCHAR(255);
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS disability_percentage DECIMAL(5, 2);
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS udid_number VARCHAR(50);
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS minority_status VARCHAR(100);
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS ex_serviceman_defence_quota BOOLEAN DEFAULT FALSE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS kashmiri_migrant_regional_quota BOOLEAN DEFAULT FALSE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS state_domicile BOOLEAN DEFAULT FALSE;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS home_state_for_quota VARCHAR(100);
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE category_and_reservation ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_category_and_reservation_user_id ON category_and_reservation(user_id);
CREATE INDEX IF NOT EXISTS idx_category_and_reservation_category_id ON category_and_reservation(category_id);

-- Trigger to automatically update updated_at for category_and_reservation
DROP TRIGGER IF EXISTS update_category_and_reservation_updated_at ON category_and_reservation;
CREATE TRIGGER update_category_and_reservation_updated_at BEFORE UPDATE ON category_and_reservation
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE category_and_reservation IS 'Stores user category and reservation details (SC/ST/OBC/General, EWS, PwBD, etc.)';
COMMENT ON COLUMN category_and_reservation.category_id IS 'Foreign key to categories table';
COMMENT ON COLUMN category_and_reservation.ews_status IS 'Economically Weaker Section status';
COMMENT ON COLUMN category_and_reservation.pwbd_status IS 'Person with Benchmark Disability status';
COMMENT ON COLUMN category_and_reservation.udid_number IS 'Unique Disability ID number';
COMMENT ON COLUMN category_and_reservation.state_domicile IS 'State domicile status (true if user has state domicile)';
COMMENT ON COLUMN category_and_reservation.home_state_for_quota IS 'Home state for quota purposes';


