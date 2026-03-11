-- Migration: Add latitude and longitude columns to users table
-- This allows storing the user's current location coordinates

-- Add latitude column (DECIMAL for precision)
ALTER TABLE users ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);

-- Add longitude column (DECIMAL for precision)
ALTER TABLE users ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add comments
COMMENT ON COLUMN users.latitude IS 'User current location latitude coordinate';
COMMENT ON COLUMN users.longitude IS 'User current location longitude coordinate';

