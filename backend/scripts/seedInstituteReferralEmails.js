/**
 * Fill institutes.referral_contact_email with a placeholder when empty (dev / demos).
 * Skips rows that already have a value.
 *
 * Run: cd backend && npm run seed:institute-emails
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');

async function main() {
  console.log('📬 Seeding institute referral contact emails…\n');
  try {
    const r = await db.query(
      `UPDATE institutes
       SET referral_contact_email = 'referrals+' || id::text || '@unitracko.example'
       WHERE referral_contact_email IS NULL OR TRIM(referral_contact_email) = ''`
    );
    console.log('✅ Updated rows:', r.rowCount);

    const list = await db.query(
      `SELECT id, institute_name, referral_contact_email FROM institutes ORDER BY id`
    );
    console.log('\nInstitutes:');
    list.rows.forEach((row) => {
      console.log(`   ${row.id} | ${row.institute_name} | ${row.referral_contact_email || '(empty)'}`);
    });
    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌', err.message);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

main();
