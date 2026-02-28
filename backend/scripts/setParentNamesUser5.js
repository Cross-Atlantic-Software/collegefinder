/**
 * Set mother_full_name and father_full_name for user id 5.
 * Usage: node scripts/setParentNamesUser5.js
 * Edit MOTHER_NAME and FATHER_NAME below if needed.
 */

require('dotenv').config();
const db = require('../src/config/database');

const USER_ID = 5;
const FATHER_NAME = 'Rajesh Kumar Sharma';
const MOTHER_NAME = 'Priya Sharma';

async function main() {
  try {
    const res = await db.query(
      `UPDATE users 
       SET father_full_name = $1, mother_full_name = $2, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $3 
       RETURNING id, email, father_full_name, mother_full_name`,
      [FATHER_NAME, MOTHER_NAME, USER_ID]
    );

    if (!res.rows || res.rows.length === 0) {
      console.log(`No user found with id=${USER_ID}.`);
      process.exit(1);
    }

    const user = res.rows[0];
    console.log(`Updated user id=${user.id}:`);
    console.log(`  father_full_name: ${user.father_full_name}`);
    console.log(`  mother_full_name: ${user.mother_full_name}`);
  } catch (err) {
    console.error(err);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

main();
