-- Migration: Remove username column from admin_users table
-- Run this if you have existing admin_users with username column

-- Drop the username index first
DROP INDEX IF EXISTS idx_admin_users_username;

-- Drop the username column
ALTER TABLE admin_users DROP COLUMN IF EXISTS username;

