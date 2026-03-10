/**
 * Cleanup script for test system restructure
 * Deletes all test-related data and keeps only JEE Main in exams_taxonomies
 * 
 * Run: node scripts/cleanupTestData.js
 * Or: docker-compose exec backend node scripts/cleanupTestData.js
 */
require('dotenv').config();
const { pool } = require('../src/config/database');

async function cleanupTestData() {
  const client = await pool.connect();
  
  try {
    console.log('🧹 Starting test data cleanup...\n');
    
    await client.query('BEGIN');
    
    // 1. Delete all question attempts
    console.log('📝 Deleting all user_attempt_answers...');
    const qaResult = await client.query('DELETE FROM user_attempt_answers');
    console.log(`   ✅ Deleted ${qaResult.rowCount} question attempts\n`);
    
    // 2. Delete all test attempts
    console.log('📝 Deleting all user_exam_attempts...');
    const taResult = await client.query('DELETE FROM user_exam_attempts');
    console.log(`   ✅ Deleted ${taResult.rowCount} test attempts\n`);
    
    // 3. Delete all mock questions
    console.log('📝 Deleting all exam_mock_questions...');
    const mqResult = await client.query('DELETE FROM exam_mock_questions');
    console.log(`   ✅ Deleted ${mqResult.rowCount} mock questions\n`);
    
    // 4. Delete all mock tests
    console.log('📝 Deleting all exam_mocks...');
    const mtResult = await client.query('DELETE FROM exam_mocks');
    console.log(`   ✅ Deleted ${mtResult.rowCount} mock tests\n`);
    
    // 5. Delete all exams EXCEPT JEE Main
    console.log('📝 Deleting all exams except JEE Main...');
    const examResult = await client.query(
      "DELETE FROM exams_taxonomies WHERE code != 'JEE_MAIN'"
    );
    console.log(`   ✅ Deleted ${examResult.rowCount} exams (kept JEE Main)\n`);
    
    // 6. Verify JEE Main still exists
    const jeeCheck = await client.query(
      "SELECT id, name, code FROM exams_taxonomies WHERE code = 'JEE_MAIN'"
    );
    
    if (jeeCheck.rows.length === 0) {
      throw new Error('❌ JEE Main not found! Please run seedExams.js first.');
    }
    
    console.log(`✅ JEE Main verified: ID ${jeeCheck.rows[0].id}, Name: ${jeeCheck.rows[0].name}\n`);
    
    await client.query('COMMIT');
    
    console.log('✅ Cleanup completed successfully!\n');
    console.log('Summary:');
    console.log(`  - Question attempts deleted: ${qaResult.rowCount}`);
    console.log(`  - Test attempts deleted: ${taResult.rowCount}`);
    console.log(`  - Mock questions deleted: ${mqResult.rowCount}`);
    console.log(`  - Mock tests deleted: ${mtResult.rowCount}`);
    console.log(`  - Exams deleted: ${examResult.rowCount}`);
    console.log(`  - JEE Main retained: Yes\n`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Cleanup failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupTestData().catch((err) => {
  console.error('❌ cleanupTestData script failed:', err);
  process.exit(1);
});
