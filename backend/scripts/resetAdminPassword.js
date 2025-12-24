/**
 * Script to reset admin user password
 * 
 * Usage:
 *   node scripts/resetAdminPassword.js <email> <newPassword>
 * 
 * Example:
 *   node scripts/resetAdminPassword.js admin@collegefinder.com 12345678
 */

require('dotenv').config();
const db = require('../src/config/database');
const bcrypt = require('bcryptjs');

async function resetAdminPassword(email, newPassword) {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Validate inputs
    if (!email || !newPassword) {
      console.error('❌ Email and password are required');
      console.log('\nUsage: node scripts/resetAdminPassword.js <email> <newPassword>');
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      process.exit(1);
    }

    if (newPassword.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      process.exit(1);
    }

    // Check if admin exists
    const existingAdmin = await db.query(
      'SELECT id, email, type FROM admin_users WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length === 0) {
      console.error(`❌ Admin user with email "${email}" not found`);
      process.exit(1);
    }

    const admin = existingAdmin.rows[0];
    console.log(`Found admin user:`);
    console.log(`  ID: ${admin.id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Type: ${admin.type}\n`);

    // Hash the new password
    console.log('Hashing new password...');
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password in database
    const result = await db.query(
      'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2 RETURNING id, email, type',
      [passwordHash, email]
    );

    console.log('\n✅ Password reset successfully!');
    console.log('Updated admin details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Type: ${result.rows[0].type}`);
    console.log('\n📝 New login credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${newPassword}`);
    console.log('\nYou can now login to the admin panel at /admin/login');

    // Close database pool
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error.message);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

// Get command line arguments
const args = process.argv.slice(2);
const [email, newPassword] = args;

if (!email || !newPassword) {
  console.error('❌ Email and password are required');
  console.log('\nUsage: node scripts/resetAdminPassword.js <email> <newPassword>');
  console.log('Example: node scripts/resetAdminPassword.js admin@collegefinder.com 12345678');
  process.exit(1);
}

// Run the script
resetAdminPassword(email, newPassword);



