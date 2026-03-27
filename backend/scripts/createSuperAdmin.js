/**
 * Create a super_admin user in admin_users (for local/dev).
 * Super admins cannot be created via the API; use this script to seed one.
 *
 * Run from repo root: node backend/scripts/createSuperAdmin.js
 * Or from backend: node scripts/createSuperAdmin.js
 *
 * Local admin login (after running this script):
 *   Email:    sharmaharsh634@gmail.com
 *   Password: 12345678
 */

require('dotenv').config();
const Admin = require('../src/models/admin/Admin');

const EMAIL = 'sharmaharsh634@gmail.com';
const PASSWORD = '12345678';

async function main() {
  try {
    const existing = await Admin.findByEmail(EMAIL);
    if (existing) {
      if (existing.type === 'super_admin') {
        console.log('Super admin already exists:', EMAIL);
        return;
      }
      console.error('Email already exists as non–super_admin. Use a different email or update in DB.');
      process.exit(1);
    }

    const admin = await Admin.create(EMAIL, PASSWORD, 'super_admin', null);
    console.log('Super admin created:', admin.email, '(id:', admin.id, ')');
    console.log('Local login: email =', EMAIL, ', password =', PASSWORD);
  } catch (err) {
    console.error('Error creating super admin:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
