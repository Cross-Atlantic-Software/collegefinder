-- Add updated_by column to streams table
ALTER TABLE streams ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_streams_updated_by ON streams(updated_by);
COMMENT ON COLUMN streams.updated_by IS 'Admin user ID who last updated this stream';
