/**
 * Clear all tables in the database by dropping and recreating the public schema.
 * Run: node scripts/clearAllTables.js
 * Requires: DB_* env vars or .env (same as backend)
 *
 * After running, restart the backend to re-apply schema.
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'collegefinder_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function clearAllTables() {
  const client = await pool.connect();
  try {
    console.log('🗑️  Dropping public schema (all tables, views, etc.)...');
    await client.query('DROP SCHEMA public CASCADE');
    await client.query('CREATE SCHEMA public');
    await client.query('GRANT ALL ON SCHEMA public TO postgres');
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅ All tables cleared. Restart the backend to re-apply schema.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

clearAllTables();
