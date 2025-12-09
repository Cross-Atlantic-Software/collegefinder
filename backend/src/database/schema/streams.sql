-- Streams Table
-- Stores the available stream options that can be selected for blogs
CREATE TABLE IF NOT EXISTS streams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status BOOLEAN DEFAULT TRUE, -- true = active, false = inactive
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Ensure columns exist on older databases (only if table already exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'streams') THEN
    ALTER TABLE streams ADD COLUMN IF NOT EXISTS name VARCHAR(255);
    ALTER TABLE streams ADD COLUMN IF NOT EXISTS status BOOLEAN DEFAULT TRUE;
    ALTER TABLE streams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    ALTER TABLE streams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
  END IF;
END $$;

-- Add unique constraint for name if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'streams_name_key'
  ) THEN
    ALTER TABLE streams ADD CONSTRAINT streams_name_key UNIQUE (name);
  END IF;
END $$;

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_streams_name ON streams(name);
CREATE INDEX IF NOT EXISTS idx_streams_status ON streams(status);

-- Trigger to automatically update updated_at for streams
DROP TRIGGER IF EXISTS update_streams_updated_at ON streams;
CREATE TRIGGER update_streams_updated_at BEFORE UPDATE ON streams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE streams IS 'Taxonomy table for stream options that can be selected for blogs';
COMMENT ON COLUMN streams.name IS 'Display name for the stream (e.g., PCM, PCB, Commerce, Arts)';
COMMENT ON COLUMN streams.status IS 'Active status of the stream (true = active, false = inactive)';


