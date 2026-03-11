/**
 * Script to check admin users in the database
 * 
 * Usage:
 *   node scripts/checkAdminUsers.js
 */

require('dotenv').config();
const db = require('../src/config/database');

async function checkAdminUsers() {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Query all admin users
    const result = await db.query(
      `SELECT id, email, type, is_active, created_at, last_login 
       FROM admin_users 
       ORDER BY id ASC`
    );

    if (result.rows.length === 0) {
      console.log('⚠️  No admin users found in the database.');
      console.log('\nTo create a super admin, run:');
      console.log('  npm run create-super-admin');
      console.log('  OR');
      console.log('  node scripts/createSuperAdmin.js <email> <password>');
    } else {
      console.log(`Found ${result.rows.length} admin user(s):\n`);
      console.log('─'.repeat(80));
      result.rows.forEach((admin, index) => {
        console.log(`\nAdmin #${index + 1}:`);
        console.log(`  ID: ${admin.id}`);
        console.log(`  Email: ${admin.email}`);
        console.log(`  Type: ${admin.type}`);
        console.log(`  Active: ${admin.is_active ? 'Yes' : 'No'}`);
        console.log(`  Created: ${admin.created_at}`);
        console.log(`  Last Login: ${admin.last_login || 'Never'}`);
      });
      console.log('\n' + '─'.repeat(80));
      console.log('\n⚠️  Note: Passwords are hashed and cannot be retrieved.');
      console.log('If you need to reset a password, you can create a new admin user or modify the database directly.');
    }

    // Close database pool
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

// Run the script
checkAdminUsers();






