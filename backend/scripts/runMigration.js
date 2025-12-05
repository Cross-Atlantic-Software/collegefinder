/**
 * Script to run database migrations
 * Usage: node scripts/runMigration.js <migration-file>
 * Example: node scripts/runMigration.js src/database/migrations/add_user_fields.sql
 */

require('dotenv').config();
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration(migrationFile) {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Read migration file
    const migrationPath = path.join(__dirname, '..', migrationFile);
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    // Execute migration
    console.log(`📝 Running migration: ${migrationFile}`);
    for (const statement of statements) {
      if (statement.trim()) {
        await db.query(statement);
      }
    }
    
    console.log('✅ Migration completed successfully!');
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error running migration:', error.message);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

// Get migration file from command line
const migrationFile = process.argv[2];
if (!migrationFile) {
  console.error('❌ Please provide a migration file path');
  console.log('Usage: node scripts/runMigration.js <migration-file>');
  console.log('Example: node scripts/runMigration.js src/database/migrations/add_user_fields.sql');
  process.exit(1);
}

runMigration(migrationFile);

