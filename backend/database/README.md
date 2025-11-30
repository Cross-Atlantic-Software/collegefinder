# Database Schema

This directory contains modular database schema files for the College Finder application.

## Structure

The schema is split into modular files for better organization and maintainability:

### Core Files

- **`schema.sql`** - Main schema file (placeholder, actual loading handled by `database.js`)
- **`functions.sql`** - Database functions (e.g., `update_updated_at_column()`)
- **`users.sql`** - Users table and related indexes/triggers
- **`otps.sql`** - OTP table for email verification and related indexes
- **`admin_users.sql`** - Admin users table and related indexes/triggers

## Execution Order

The schema files are loaded in a specific order to respect dependencies:

1. **functions.sql** - Must be loaded first (contains functions used by triggers)
2. **users.sql** - Base users table (no dependencies)
3. **otps.sql** - Depends on `users` table (foreign key reference)
4. **admin_users.sql** - Self-referencing table (foreign key to itself)

## Adding New Schema Files

When adding a new schema file:

1. Create the new `.sql` file in this directory
2. Add it to the `schemaFiles` array in `backend/config/database.js`
3. Place it in the correct position based on dependencies
4. Update this README with the new file information

## Example: Adding a New Table

```sql
-- backend/database/posts.sql
CREATE TABLE IF NOT EXISTS posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);

DROP TRIGGER IF EXISTS update_posts_updated_at ON posts;
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

Then add `'posts.sql'` to the `schemaFiles` array in `backend/config/database.js` after `'users.sql'` (since it depends on users).

