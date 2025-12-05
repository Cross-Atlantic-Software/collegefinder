-- Drop all tables in the correct order (respecting foreign key dependencies)
-- WARNING: This will delete all data in these tables!

-- Drop tables that have foreign keys first
DROP TABLE IF EXISTS otps CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Note: Functions will remain, but you can drop them too if needed:
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;


