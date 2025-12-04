/**
 * Script to directly add subjects column to user_academics table
 * Run this if the column doesn't exist: node scripts/addSubjectsColumn.js
 */

require('dotenv').config();
const db = require('../config/database');

async function addSubjectsColumn() {
  try {
    console.log('🔍 Checking if subjects column exists...');
    
    // Check if column exists
    const checkResult = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_academics' 
      AND column_name = 'subjects'
    `);
    
    if (checkResult.rows.length > 0) {
      console.log('✅ Subjects column already exists!');
      await db.pool.end();
      process.exit(0);
    }
    
    console.log('📝 Adding subjects column...');
    
    // Add the column
    await db.query(`
      ALTER TABLE user_academics 
      ADD COLUMN subjects JSONB
    `);
    
    // Add comment
    await db.query(`
      COMMENT ON COLUMN user_academics.subjects IS 
      'Array of subjects: [{"name": "Physics", "percent": 89}, ...]'
    `);
    
    console.log('✅ Subjects column added successfully!');
    
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding subjects column:', error.message);
    console.error('Full error:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

addSubjectsColumn();

