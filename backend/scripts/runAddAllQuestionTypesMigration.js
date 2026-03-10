/**
 * Run migration to add all 8 question types
 * Run with: node backend/scripts/runAddAllQuestionTypesMigration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

async function main() {
  try {
    console.log('Running migration: add_all_question_types.sql');
    
    const migrationPath = path.join(__dirname, '../src/database/migrations/add_all_question_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    await db.query(sql);
    
    console.log('✅ Migration completed successfully');
    console.log('   - Updated question_type CHECK constraint to include all 8 types');
    console.log('   - Added paragraph_context, assertion, reason, match_pairs columns');
    console.log('   - Migrated existing mcq -> mcq_single');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
