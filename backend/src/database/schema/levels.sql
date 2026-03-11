-- Levels Table
-- Stores educational levels
CREATE TABLE IF NOT EXISTS levels (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'levels') THEN
    ALTER TABLE levels ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE levels ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE levels ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE levels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_levels_name ON levels(name);
CREATE INDEX IF NOT EXISTS idx_levels_status ON levels(status);

-- Trigger to automatically update updated_at for levels
DROP TRIGGER IF EXISTS update_levels_updated_at ON levels;
CREATE TRIGGER update_levels_updated_at BEFORE UPDATE ON levels
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE levels IS 'Levels table - educational levels';
COMMENT ON COLUMN levels.name IS 'Display name for the level';
COMMENT ON COLUMN levels.status IS 'Active status of the level (true = active, false = inactive)';

