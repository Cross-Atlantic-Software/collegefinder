-- Display order for streams (admin-controlled; public lists use this everywhere)
ALTER TABLE streams ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_streams_sort_order ON streams (sort_order, name);
