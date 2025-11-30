-- Migration: Add name, email_verified, and auth_provider fields to users table
-- Run this if you have existing users table without these fields

-- Add name field (nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Add email_verified field (default false)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Add auth_provider field (default 'email')
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(50) DEFAULT 'email';

-- Update existing users to have email_verified = false if null
UPDATE users SET email_verified = false WHERE email_verified IS NULL;

-- Update existing users to have auth_provider = 'email' if null
UPDATE users SET auth_provider = 'email' WHERE auth_provider IS NULL;

