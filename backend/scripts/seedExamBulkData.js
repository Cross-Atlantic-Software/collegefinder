/**
 * Seed script for exam bulk upload dependencies
 * Adds subjects, programs, and colleges referenced in exam bulk template
 * Run from backend/: node scripts/seedExamBulkData.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { pool } = require('../src/config/database');

// Subject name -> stream names (from streams table)
const subjectStreamMap = {
  'Physics': ['Science – PCM (Physics, Chemistry, Math)', 'Science – PCB (Physics, Chemistry, Biology)', 'Science – PCMB (Physics, Chemistry, Math, Biology)'],
  'Chemistry': ['Science – PCM (Physics, Chemistry, Math)', 'Science – PCB (Physics, Chemistry, Biology)', 'Science – PCMB (Physics, Chemistry, Math, Biology)'],
  'Mathematics': ['Science – PCM (Physics, Chemistry, Math)', 'Science – PCMB (Physics, Chemistry, Math, Biology)'],
  'Biology': ['Science – PCB (Physics, Chemistry, Biology)', 'Science – PCMB (Physics, Chemistry, Math, Biology)'],
};

const programs = [
  'B.Tech',
  'B.E.',
  'MBBS',
  'BDS',
  'M.Tech',
  'MD',
  'B.Arch',
  'B.Sc.',
];

const colleges = [
  { name: 'IIT Delhi', location: 'New Delhi', type: 'Central' },
  { name: 'NIT Trichy', location: 'Tiruchirappalli', type: 'Central' },
  { name: 'BITS Pilani', location: 'Pilani', type: 'Private' },
  { name: 'AIIMS Delhi', location: 'New Delhi', type: 'Central' },
  { name: 'AFMC Pune', location: 'Pune', type: 'Central' },
  { name: 'JIPMER Puducherry', location: 'Puducherry', type: 'Central' },
];

async function seedSubjects() {
  console.log('🌱 Seeding subjects...');
  const streamRows = await pool.query('SELECT id, name FROM streams ORDER BY name');
  const streamNameToId = Object.fromEntries(streamRows.rows.map((r) => [r.name, r.id]));

  for (const [subjectName, streamNames] of Object.entries(subjectStreamMap)) {
    const streamIds = streamNames
      .map((sn) => streamNameToId[sn])
      .filter(Boolean);
    const streamsJson = JSON.stringify(streamIds);

    await pool.query(
      `INSERT INTO subjects (name, streams, status) 
       VALUES ($1, $2::jsonb, true) 
       ON CONFLICT (name) DO UPDATE SET streams = $2::jsonb, updated_at = CURRENT_TIMESTAMP`,
      [subjectName, streamsJson]
    );
    console.log(`  ✓ Subject: ${subjectName} (streams: ${streamIds.length})`);
  }
}

async function seedPrograms() {
  console.log('🌱 Seeding programs...');
  for (const name of programs) {
    await pool.query(
      `INSERT INTO programs (name, status) 
       VALUES ($1, true) 
       ON CONFLICT (name) DO NOTHING`,
      [name]
    );
    console.log(`  ✓ Program: ${name}`);
  }
}

async function seedColleges() {
  console.log('🌱 Seeding colleges...');
  for (const c of colleges) {
    const existing = await pool.query(
      'SELECT id FROM colleges WHERE LOWER(college_name) = LOWER($1)',
      [c.name]
    );
    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO colleges (college_name, college_location, college_type) 
         VALUES ($1, $2, $3)`,
        [c.name, c.location, c.type]
      );
      console.log(`  ✓ College: ${c.name}`);
    } else {
      console.log(`  - College already exists: ${c.name}`);
    }
  }
}

const streamNames = [
  'Science – PCM (Physics, Chemistry, Math)',
  'Science – PCB (Physics, Chemistry, Biology)',
  'Science – PCMB (Physics, Chemistry, Math, Biology)',
  'Commerce',
  'Humanities',
  'Vocational',
  'Others',
];

async function seedStreams() {
  console.log('🌱 Seeding streams (if missing)...');
  for (const name of streamNames) {
    await pool.query(
      `INSERT INTO streams (name, status) VALUES ($1, true) ON CONFLICT (name) DO NOTHING`,
      [name]
    );
  }
}

async function run() {
  try {
    await Promise.race([
      pool.query('SELECT 1'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB connection timeout')), 5000))
    ]);

    await seedStreams();
    await seedSubjects();
    await seedPrograms();
    await seedColleges();

    console.log('\n✅ Exam bulk data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

run();
