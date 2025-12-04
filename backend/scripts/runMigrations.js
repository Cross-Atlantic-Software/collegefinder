/**
 * Database Migration Script
 * Run this to apply schema changes to existing databases
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'collegefinder_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function runMigrations() {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  
  // Migration files in order
  const migrationFiles = [
    'replace_location_with_state_district.sql',
    'remove_dream_careers_vibes.sql'
  ];

  try {
    console.log('🔄 Starting database migrations...\n');

    for (const file of migrationFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      console.log(`📄 Running migration: ${file}`);
      await pool.query(sql);
      console.log(`✅ Completed: ${file}\n`);
    }

    console.log('✅ All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

