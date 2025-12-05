require('dotenv').config();
const db = require('../src/config/database');

async function clearUsers() {
  try {
    console.log('🗑️  Clearing users table...');
    
    // Delete all users (this will cascade delete related OTPs due to foreign key)
    const result = await db.query('DELETE FROM users');
    
    console.log(`✅ Deleted ${result.rowCount} user(s) from the database`);
    console.log('✅ Users table cleared successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing users:', error);
    process.exit(1);
  }
}

clearUsers();


