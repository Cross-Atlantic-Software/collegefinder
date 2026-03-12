-- Add updated_by column to career_goals_taxonomies table
ALTER TABLE career_goals_taxonomies ADD COLUMN IF NOT EXISTS updated_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_career_goals_taxonomies_updated_by ON career_goals_taxonomies(updated_by);
COMMENT ON COLUMN career_goals_taxonomies.updated_by IS 'Admin user ID who last updated this interest';

-- Make logo nullable (allow interests without images)
ALTER TABLE career_goals_taxonomies ALTER COLUMN logo DROP NOT NULL;
