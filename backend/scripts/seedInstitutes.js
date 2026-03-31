/**
 * Seed sample coaching institutes (main row + details + statistics + referral codes).
 * Skips institutes that already exist by name; backfills referral_code if missing.
 *
 * Run from backend folder: npm run seed:institutes
 * Or: node scripts/seedInstitutes.js (from backend/)
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/config/database');
const Institute = require('../src/models/institute/Institute');
const InstituteDetails = require('../src/models/institute/InstituteDetails');
const InstituteStatistics = require('../src/models/institute/InstituteStatistics');
const Referral = require('../src/models/referral/Referral');

const SEED_ROWS = [
  {
    institute_name: 'Allen Career Institute',
    institute_location: 'Kota, Rajasthan',
    type: 'offline',
    website: 'https://www.allen.ac.in',
    contact_number: '+91-744-2757575',
    referral_contact_email: 'partners@example.com, outreach@example.com',
    institute_description:
      'Premier coaching for JEE and NEET with structured classroom programs and test series.',
    demo_available: true,
    scholarship_available: true,
    ranking_score: 94.5,
    success_rate: 88.2,
    student_rating: 4.6,
  },
  {
    institute_name: 'FIITJEE South Delhi',
    institute_location: 'New Delhi',
    type: 'hybrid',
    website: 'https://www.fiitjee.com',
    contact_number: '+91-11-46060606',
    institute_description:
      'JEE-focused programs with classroom and online options; known for Olympiad training.',
    demo_available: true,
    scholarship_available: true,
    ranking_score: 92.0,
    success_rate: 85.0,
    student_rating: 4.5,
  },
  {
    institute_name: 'Aakash Institute',
    institute_location: 'Pan India',
    type: 'hybrid',
    website: 'https://www.aakash.ac.in',
    contact_number: '+91-8800013111',
    institute_description:
      'Medical and engineering entrance preparation with national test series.',
    demo_available: true,
    scholarship_available: true,
    ranking_score: 90.5,
    success_rate: 82.5,
    student_rating: 4.4,
  },
  {
    institute_name: 'Resonance Eduventures',
    institute_location: 'Kota, Rajasthan',
    type: 'offline',
    website: 'https://www.resonance.ac.in',
    contact_number: '+91-744-2777700',
    institute_description:
      'JEE Main, Advanced, and NEET coaching with integrated school programs.',
    demo_available: false,
    scholarship_available: true,
    ranking_score: 89.0,
    success_rate: 81.0,
    student_rating: 4.3,
  },
  {
    institute_name: 'Sri Chaitanya Educational Institutions',
    institute_location: 'Hyderabad, Telangana',
    type: 'hybrid',
    website: 'https://www.srichaitanya.net',
    contact_number: '+91-40-23456789',
    institute_description:
      'Integrated IIT-JEE and NEET preparation across South India.',
    demo_available: true,
    scholarship_available: false,
    ranking_score: 87.5,
    success_rate: 79.5,
    student_rating: 4.2,
  },
  {
    institute_name: 'Narayana Coaching Centre',
    institute_location: 'Bengaluru, Karnataka',
    type: 'offline',
    website: 'https://www.narayanacoachingcenters.in',
    contact_number: '+91-80-41234567',
    institute_description:
      'Competitive exam coaching for JEE and NEET with micro-schedule planning.',
    demo_available: true,
    scholarship_available: true,
    ranking_score: 86.0,
    success_rate: 78.0,
    student_rating: 4.1,
  },
];

async function ensureReferralCode(institute) {
  const existing = await Referral.getInstituteCode(institute.id);
  if (existing) return existing;
  const code = await Referral.generateAndSaveInstituteCode(institute.id, institute.institute_name);
  return code;
}

async function main() {
  console.log('🌱 Seeding institutes…\n');

  try {
    for (const row of SEED_ROWS) {
      let institute = await Institute.findByName(row.institute_name);

      if (institute) {
        const ref = await ensureReferralCode(institute);
        console.log(`⏭️  Skip (exists): ${institute.institute_name} — referral: ${ref}`);
        continue;
      }

      institute = await Institute.create({
        institute_name: row.institute_name,
        institute_location: row.institute_location,
        type: row.type,
        website: row.website,
        contact_number: row.contact_number,
        referral_contact_email: row.referral_contact_email ?? null,
      });

      await InstituteDetails.create({
        institute_id: institute.id,
        institute_description: row.institute_description,
        demo_available: row.demo_available,
        scholarship_available: row.scholarship_available,
      });

      await InstituteStatistics.create({
        institute_id: institute.id,
        ranking_score: row.ranking_score,
        success_rate: row.success_rate,
        student_rating: row.student_rating,
      });

      const refCode = await ensureReferralCode(institute);
      console.log(`✅ Created: ${institute.institute_name} (id ${institute.id}) — referral: ${refCode}`);
    }

    console.log('\n📋 Institutes in database:');
    const all = await db.query(
      `SELECT id, institute_name, type, referral_code FROM institutes ORDER BY id`
    );
    all.rows.forEach((r) => {
      console.log(`   ${r.id} | ${r.institute_name} | ${r.type || '-'} | ${r.referral_code || '(no code)'}`);
    });

    console.log('\n✨ Done.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
}

main();
