/**
 * Script to create initial super admin
 * 
 * Usage:
 *   npm run create-super-admin
 *   OR
 *   node scripts/createSuperAdmin.js <email> <password>
 * 
 * Example:
 *   node scripts/createSuperAdmin.js admin@example.com admin123
 */

require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Get command line arguments
const args = process.argv.slice(2);
const [emailArg, passwordArg] = args;

// Create readline interface only if needed
let rl = null;
if (!emailArg || !passwordArg) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function question(query) {
  if (!rl) {
    throw new Error('Readline interface not initialized');
  }
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

function closeReadline() {
  if (rl) {
    rl.close();
  }
}

async function createSuperAdmin(email, password) {
  try {
    // Initialize database connection
    await db.init();
    console.log('✅ Database connected\n');

    // Validate inputs
    if (!email || !password) {
      console.error('❌ All fields are required');
      closeReadline();
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error('❌ Invalid email format');
      closeReadline();
      process.exit(1);
    }

    if (password.length < 6) {
      console.error('❌ Password must be at least 6 characters');
      closeReadline();
      process.exit(1);
    }

    // Check if super admin already exists
    const existingAdmin = await db.query(
      "SELECT * FROM admin_users WHERE type = 'super_admin'"
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️  Super admin already exists');
      if (rl) {
        const proceed = await question('Do you want to create another admin? (yes/no): ');
        if (proceed.toLowerCase() !== 'yes') {
          console.log('Cancelled');
          closeReadline();
          process.exit(0);
        }
      } else {
        console.log('Use the admin panel to create additional admins.');
        closeReadline();
        process.exit(0);
      }
    }

    // Check if email already exists
    const existingEmail = await db.query(
      'SELECT * FROM admin_users WHERE email = $1',
      [email]
    );
    if (existingEmail.rows.length > 0) {
      console.error('❌ Email already exists');
      closeReadline();
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create super admin
    const result = await db.query(
      `INSERT INTO admin_users (email, password_hash, type) 
       VALUES ($1, $2, 'super_admin') 
       RETURNING id, email, type, created_at`,
      [email, passwordHash]
    );

    console.log('\n✅ Super admin created successfully!');
    console.log('Admin details:');
    console.log(`  ID: ${result.rows[0].id}`);
    console.log(`  Email: ${result.rows[0].email}`);
    console.log(`  Type: ${result.rows[0].type}`);
    console.log('\n📝 Login credentials:');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${password}`);
    console.log('\nYou can now login to the admin panel at /admin/login');

    closeReadline();
    
    // Close database pool
    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    closeReadline();
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\nCancelled by user');
  closeReadline();
  process.exit(0);
});

// Main execution
(async () => {
  if (emailArg && passwordArg) {
    // Use command line arguments
    await createSuperAdmin(emailArg, passwordArg);
  } else {
    // Interactive mode
    if (!rl) {
      rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
    }
    
    try {
      const email = await question('Enter email for super admin: ');
      const password = await question('Enter password for super admin: ');
      await createSuperAdmin(email, password);
    } catch (error) {
      console.error('❌ Error:', error.message);
      closeReadline();
      process.exit(1);
    }
  }
})();
