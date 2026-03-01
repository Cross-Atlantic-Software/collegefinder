/**
 * Set automation_password for user "harsh" using Option B: name@last4phone@DDMMYY
 * Usage: node scripts/setAutomationPasswordHarsh.js
 */

require('dotenv').config();
const db = require('../src/config/database');

function generatePassword(name, firstName, phoneNumber, dateOfBirth) {
  const namePart = (firstName || '').trim() || (name || '').trim();
  const firstWord = namePart ? namePart.split(/\s+/)[0] : 'User';
  const nameClean = firstWord.replace(/\W/g, '') || 'User';

  const digits = (phoneNumber || '').replace(/\D/g, '');
  const last4 = digits.length >= 4 ? digits.slice(-4) : digits.padStart(4, '0').slice(0, 4);

  let ddmmyy = '010100';
  if (dateOfBirth) {
    const d = new Date(dateOfBirth);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yy = String(d.getFullYear()).slice(-2);
    ddmmyy = `${dd}${mm}${yy}`;
  }

  return `${nameClean}@${last4}@${ddmmyy}`;
}

async function main() {
  try {
    const res = await db.query(
      `SELECT id, name, first_name, phone_number, date_of_birth 
       FROM users 
       WHERE LOWER(TRIM(first_name)) = 'harsh' OR LOWER(name) LIKE '%harsh%'
       LIMIT 1`
    );

    if (!res.rows || res.rows.length === 0) {
      console.log('No user found with first_name or name containing "harsh".');
      process.exit(1);
    }

    const user = res.rows[0];
    const password = generatePassword(
      user.name,
      user.first_name,
      user.phone_number,
      user.date_of_birth
    );

    await db.query(
      `UPDATE users SET automation_password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [password, user.id]
    );

    console.log(`Set automation_password for user id=${user.id} (${user.first_name || user.name}): ${password}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
