/**
 * Seed sample data for design and user-flow testing.
 *
 * Usage:
 *   node scripts/seedSampleDataForTesting.js
 *   node scripts/seedSampleDataForTesting.js --reset
 *
 * Notes:
 * - Idempotent: safe to run multiple times.
 * - --reset only clears demo users created by this script and their linked profile tables.
 */

require('dotenv').config();
const db = require('../src/config/database');

const args = process.argv.slice(2);
const shouldReset = args.includes('--reset');

const DEMO_USERS = [
  {
    email: 'student.full.demo@unitracko.test',
    name: 'Aarav Verma',
    first_name: 'Aarav',
    last_name: 'Verma',
    gender: 'Male',
    date_of_birth: '2006-04-12',
    phone_number: '+91 9000000001',
    state: 'Delhi',
    district: 'New Delhi',
    onboarding_completed: true,
    type: 'full'
  },
  {
    email: 'student.partial.demo@unitracko.test',
    name: 'Riya Singh',
    first_name: 'Riya',
    last_name: 'Singh',
    gender: 'Female',
    date_of_birth: '2007-01-25',
    phone_number: '+91 9000000002',
    state: 'Maharashtra',
    district: 'Pune',
    onboarding_completed: false,
    type: 'partial'
  }
];

const STREAMS = [
  'Science (PCM)',
  'Science (PCB)',
  'Commerce',
  'Arts/Humanities'
];

const CAREER_GOALS = [
  { label: 'Engineering & Technology', description: 'Careers in engineering, software, data, and core technology fields.' },
  { label: 'Medical & Healthcare', description: 'Careers in medicine, nursing, allied health, and clinical sciences.' },
  { label: 'Management & Business', description: 'Careers in management, entrepreneurship, and business operations.' },
  { label: 'Civil Services & Government', description: 'Public sector and government-focused career paths.' }
];

const CAREERS = [
  'Engineering',
  'Medicine',
  'Data Science',
  'Business Management',
  'Law'
];

const PROGRAMS = [
  'B.Tech',
  'MBBS',
  'B.Sc',
  'BBA',
  'BA'
];

const CATEGORIES = [
  'General',
  'OBC-NCL',
  'SC',
  'ST',
  'EWS'
];

const EXAM_CITIES = [
  'Delhi',
  'Mumbai',
  'Bengaluru',
  'Pune',
  'Kolkata'
];

function buildJeeMainFormat() {
  return {
    default: {
      name: 'JEE Main',
      duration_minutes: 180,
      total_questions: 90,
      total_marks: 300,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      sections: {
        Physics: { total_questions: 30 },
        Chemistry: { total_questions: 30 },
        Mathematics: { total_questions: 30 }
      }
    }
  };
}

function buildNeetFormat() {
  return {
    default: {
      name: 'NEET',
      duration_minutes: 180,
      total_questions: 200,
      total_marks: 720,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      sections: {
        Physics: { total_questions: 50 },
        Chemistry: { total_questions: 50 },
        Biology: { total_questions: 100 }
      }
    }
  };
}

function buildCuetFormat() {
  return {
    default: {
      name: 'CUET',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      sections: {
        General: { total_questions: 50 }
      }
    }
  };
}

function buildNataFormat() {
  return {
    default: {
      name: 'NATA',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      sections: {
        Aptitude: { total_questions: 50 }
      }
    }
  };
}

const EXAMS = [
  {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    description: 'Joint Entrance Examination Main',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildJeeMainFormat()
  },
  {
    name: 'NEET',
    code: 'NEET',
    description: 'National Eligibility cum Entrance Test',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildNeetFormat()
  },
  {
    name: 'CUET',
    code: 'CUET',
    description: 'Common University Entrance Test',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildCuetFormat()
  },
  {
    name: 'NATA',
    code: 'NATA',
    description: 'National Aptitude Test in Architecture',
    exam_type: 'National',
    conducting_authority: 'Council of Architecture (COA)',
    number_of_papers: 1,
    website: 'https://www.nata.in/',
    format: buildNataFormat()
  }
];

async function upsertTaxonomies() {
  for (const streamName of STREAMS) {
    await db.query(
      `INSERT INTO streams (name, status)
       VALUES ($1, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [streamName]
    );
  }

  for (const goal of CAREER_GOALS) {
    await db.query(
      `INSERT INTO career_goals_taxonomies (label, description, status)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (label)
       DO UPDATE SET description = EXCLUDED.description, status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [goal.label, goal.description]
    );
  }

  for (const careerName of CAREERS) {
    await db.query(
      `INSERT INTO careers (name, status)
       VALUES ($1, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [careerName]
    );
  }

  for (const programName of PROGRAMS) {
    await db.query(
      `INSERT INTO programs (name, status)
       VALUES ($1, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [programName]
    );
  }

  for (const categoryName of CATEGORIES) {
    await db.query(
      `INSERT INTO categories (name)
       VALUES ($1)
       ON CONFLICT (name)
       DO NOTHING`,
      [categoryName]
    );
  }

  for (const cityName of EXAM_CITIES) {
    await db.query(
      `INSERT INTO exam_city (name, status)
       VALUES ($1, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [cityName]
    );
  }

  const pcm = await db.query(`SELECT id FROM streams WHERE name = 'Science (PCM)' LIMIT 1`);
  const pcb = await db.query(`SELECT id FROM streams WHERE name = 'Science (PCB)' LIMIT 1`);
  const commerce = await db.query(`SELECT id FROM streams WHERE name = 'Commerce' LIMIT 1`);
  const arts = await db.query(`SELECT id FROM streams WHERE name = 'Arts/Humanities' LIMIT 1`);

  const pcmId = pcm.rows[0]?.id;
  const pcbId = pcb.rows[0]?.id;
  const commerceId = commerce.rows[0]?.id;
  const artsId = arts.rows[0]?.id;

  const subjectsToUpsert = [
    { name: 'Physics', streams: [pcmId, pcbId].filter(Boolean) },
    { name: 'Chemistry', streams: [pcmId, pcbId].filter(Boolean) },
    { name: 'Mathematics', streams: [pcmId, commerceId].filter(Boolean) },
    { name: 'Biology', streams: [pcbId].filter(Boolean) },
    { name: 'Accountancy', streams: [commerceId].filter(Boolean) },
    { name: 'Economics', streams: [commerceId, artsId].filter(Boolean) },
    { name: 'Political Science', streams: [artsId].filter(Boolean) }
  ];

  for (const subject of subjectsToUpsert) {
    await db.query(
      `INSERT INTO subjects (name, streams, status)
       VALUES ($1, $2::jsonb, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET streams = EXCLUDED.streams, status = TRUE, updated_at = CURRENT_TIMESTAMP`,
      [subject.name, JSON.stringify(subject.streams)]
    );
  }

  for (const exam of EXAMS) {
    await db.query(
      `INSERT INTO exams_taxonomies (name, code, description, exam_type, conducting_authority, format, number_of_papers, website)
       VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
       ON CONFLICT (code)
       DO UPDATE SET
         name = EXCLUDED.name,
         description = EXCLUDED.description,
         exam_type = EXCLUDED.exam_type,
         conducting_authority = EXCLUDED.conducting_authority,
         format = EXCLUDED.format,
         number_of_papers = EXCLUDED.number_of_papers,
         website = EXCLUDED.website,
         updated_at = CURRENT_TIMESTAMP`,
      [
        exam.name,
        exam.code,
        exam.description,
        exam.exam_type,
        exam.conducting_authority,
        JSON.stringify(exam.format),
        exam.number_of_papers,
        exam.website ?? null
      ]
    );
  }
}

async function resetDemoUsersOnly() {
  const demoEmails = DEMO_USERS.map(u => u.email);
  const demoUsers = await db.query(
    'SELECT id FROM users WHERE email = ANY($1::text[])',
    [demoEmails]
  );
  const demoUserIds = demoUsers.rows.map(r => r.id);

  if (demoUserIds.length === 0) {
    console.log('No existing demo users to reset.');
    return;
  }

  await db.query('DELETE FROM user_document_vault WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM user_other_info WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM category_and_reservation WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM user_exam_preferences WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM user_career_goals WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM user_academics WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM user_address WHERE user_id = ANY($1::int[])', [demoUserIds]);
  await db.query('DELETE FROM users WHERE id = ANY($1::int[])', [demoUserIds]);

  console.log(`Reset complete. Removed ${demoUserIds.length} demo user(s).`);
}

async function getIdsForFlow() {
  const [
    streamPcm,
    streamPcb,
    goals,
    exams,
    programs,
    cities,
    categories
  ] = await Promise.all([
    db.query(`SELECT id FROM streams WHERE name = 'Science (PCM)' LIMIT 1`),
    db.query(`SELECT id FROM streams WHERE name = 'Science (PCB)' LIMIT 1`),
    db.query(`SELECT id FROM career_goals_taxonomies WHERE label IN ('Engineering & Technology', 'Medical & Healthcare') ORDER BY id`),
    db.query(`SELECT id, code FROM exams_taxonomies WHERE code IN ('JEE_MAIN', 'NEET', 'CUET') ORDER BY id`),
    db.query(`SELECT id FROM programs WHERE name IN ('B.Tech', 'MBBS', 'B.Sc') ORDER BY id`),
    db.query(`SELECT id FROM exam_city WHERE name IN ('Delhi', 'Pune', 'Mumbai') ORDER BY id`),
    db.query(`SELECT id, name FROM categories WHERE name IN ('General', 'EWS') ORDER BY id`)
  ]);

  return {
    pcmId: streamPcm.rows[0]?.id || null,
    pcbId: streamPcb.rows[0]?.id || null,
    careerGoalIds: goals.rows.map(r => r.id),
    examIds: exams.rows,
    programIds: programs.rows.map(r => r.id),
    cityIds: cities.rows.map(r => r.id),
    generalCategoryId: categories.rows.find(c => c.name === 'General')?.id || null,
    ewsCategoryId: categories.rows.find(c => c.name === 'EWS')?.id || null
  };
}

async function upsertDemoUserBasics(user) {
  const result = await db.query(
    `INSERT INTO users (
      email, name, first_name, last_name, date_of_birth, gender, phone_number,
      state, district, auth_provider, email_verified, onboarding_completed, is_active
    )
    VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, 'email', TRUE, $10, TRUE)
    ON CONFLICT (email)
    DO UPDATE SET
      name = EXCLUDED.name,
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      phone_number = EXCLUDED.phone_number,
      state = EXCLUDED.state,
      district = EXCLUDED.district,
      email_verified = TRUE,
      onboarding_completed = EXCLUDED.onboarding_completed,
      is_active = TRUE,
      updated_at = CURRENT_TIMESTAMP
    RETURNING id`,
    [
      user.email,
      user.name,
      user.first_name,
      user.last_name,
      user.date_of_birth,
      user.gender,
      user.phone_number,
      user.state,
      user.district,
      user.onboarding_completed
    ]
  );

  return result.rows[0].id;
}

async function upsertFullFlowUser(userId, refs) {
  const jeeMainId = refs.examIds.find(e => e.code === 'JEE_MAIN')?.id || null;
  const neetId = refs.examIds.find(e => e.code === 'NEET')?.id || null;

  await db.query(
    `INSERT INTO user_academics (
      user_id, matric_board, matric_school_name, matric_passing_year, matric_percentage,
      postmatric_board, postmatric_school_name, postmatric_passing_year, postmatric_percentage,
      stream, stream_id, is_pursuing_12th
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE)
    ON CONFLICT (user_id)
    DO UPDATE SET
      matric_board = EXCLUDED.matric_board,
      matric_school_name = EXCLUDED.matric_school_name,
      matric_passing_year = EXCLUDED.matric_passing_year,
      matric_percentage = EXCLUDED.matric_percentage,
      postmatric_board = EXCLUDED.postmatric_board,
      postmatric_school_name = EXCLUDED.postmatric_school_name,
      postmatric_passing_year = EXCLUDED.postmatric_passing_year,
      postmatric_percentage = EXCLUDED.postmatric_percentage,
      stream = EXCLUDED.stream,
      stream_id = EXCLUDED.stream_id,
      is_pursuing_12th = EXCLUDED.is_pursuing_12th,
      updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      'CBSE',
      'Delhi Public School',
      2022,
      92.4,
      'CBSE',
      'Delhi Public School',
      2024,
      89.6,
      'Science (PCM)',
      refs.pcmId
    ]
  );

  await db.query(
    `INSERT INTO user_address (
      user_id, correspondence_address_line1, city_town_village, district, state, country, pincode,
      permanent_address_same_as_correspondence
    )
    VALUES ($1, $2, $3, $4, $5, 'India', $6, TRUE)
    ON CONFLICT (user_id)
    DO UPDATE SET
      correspondence_address_line1 = EXCLUDED.correspondence_address_line1,
      city_town_village = EXCLUDED.city_town_village,
      district = EXCLUDED.district,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      pincode = EXCLUDED.pincode,
      permanent_address_same_as_correspondence = EXCLUDED.permanent_address_same_as_correspondence,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, '221B Test Street', 'New Delhi', 'New Delhi', 'Delhi', '110001']
  );

  await db.query(
    `INSERT INTO user_career_goals (user_id, interests)
    VALUES ($1, $2::int[])
    ON CONFLICT (user_id)
    DO UPDATE SET interests = EXCLUDED.interests, updated_at = CURRENT_TIMESTAMP`,
    [userId, refs.careerGoalIds.slice(0, 2)]
  );

  await db.query(
    `INSERT INTO user_exam_preferences (user_id, target_exams, previous_attempts)
    VALUES ($1, $2::int[], $3::jsonb)
    ON CONFLICT (user_id)
    DO UPDATE SET
      target_exams = EXCLUDED.target_exams,
      previous_attempts = EXCLUDED.previous_attempts,
      updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      [jeeMainId, neetId].filter(Boolean),
      JSON.stringify(jeeMainId ? [{ exam_id: jeeMainId, year: 2025, rank: 12840 }] : [])
    ]
  );

  await db.query(
    `INSERT INTO user_other_info (user_id, medium, language, program_ids, exam_city_ids)
    VALUES ($1, 'English', 'English', $2::int[], $3::int[])
    ON CONFLICT (user_id)
    DO UPDATE SET
      medium = EXCLUDED.medium,
      language = EXCLUDED.language,
      program_ids = EXCLUDED.program_ids,
      exam_city_ids = EXCLUDED.exam_city_ids,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, refs.programIds.slice(0, 2), refs.cityIds.slice(0, 2)]
  );

  await db.query(
    `INSERT INTO category_and_reservation (
      user_id, category_id, ews_status, pwbd_status, state_domicile, home_state_for_quota
    )
    VALUES ($1, $2, TRUE, FALSE, TRUE, 'Delhi')
    ON CONFLICT (user_id)
    DO UPDATE SET
      category_id = EXCLUDED.category_id,
      ews_status = EXCLUDED.ews_status,
      pwbd_status = EXCLUDED.pwbd_status,
      state_domicile = EXCLUDED.state_domicile,
      home_state_for_quota = EXCLUDED.home_state_for_quota,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, refs.ewsCategoryId || refs.generalCategoryId]
  );
}

async function upsertPartialFlowUser(userId, refs) {
  const cuetId = refs.examIds.find(e => e.code === 'CUET')?.id || null;

  await db.query(
    `INSERT INTO user_academics (
      user_id, matric_board, matric_school_name, matric_passing_year, matric_percentage,
      stream, stream_id, is_pursuing_12th
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE)
    ON CONFLICT (user_id)
    DO UPDATE SET
      matric_board = EXCLUDED.matric_board,
      matric_school_name = EXCLUDED.matric_school_name,
      matric_passing_year = EXCLUDED.matric_passing_year,
      matric_percentage = EXCLUDED.matric_percentage,
      stream = EXCLUDED.stream,
      stream_id = EXCLUDED.stream_id,
      is_pursuing_12th = EXCLUDED.is_pursuing_12th,
      updated_at = CURRENT_TIMESTAMP`,
    [
      userId,
      'ICSE',
      'St. Mary School',
      2023,
      88.1,
      'Science (PCB)',
      refs.pcbId
    ]
  );

  await db.query(
    `INSERT INTO user_address (
      user_id, correspondence_address_line1, city_town_village, district, state, country, pincode,
      permanent_address_same_as_correspondence
    )
    VALUES ($1, $2, $3, $4, $5, 'India', $6, TRUE)
    ON CONFLICT (user_id)
    DO UPDATE SET
      correspondence_address_line1 = EXCLUDED.correspondence_address_line1,
      city_town_village = EXCLUDED.city_town_village,
      district = EXCLUDED.district,
      state = EXCLUDED.state,
      country = EXCLUDED.country,
      pincode = EXCLUDED.pincode,
      permanent_address_same_as_correspondence = EXCLUDED.permanent_address_same_as_correspondence,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, '88 Sample Residency', 'Pune', 'Pune', 'Maharashtra', '411001']
  );

  await db.query(
    `INSERT INTO user_exam_preferences (user_id, target_exams, previous_attempts)
    VALUES ($1, $2::int[], $3::jsonb)
    ON CONFLICT (user_id)
    DO UPDATE SET
      target_exams = EXCLUDED.target_exams,
      previous_attempts = EXCLUDED.previous_attempts,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, [cuetId].filter(Boolean), JSON.stringify([])]
  );

  await db.query(
    `INSERT INTO user_other_info (user_id, medium, language, program_ids, exam_city_ids)
    VALUES ($1, 'English', 'Hindi', $2::int[], $3::int[])
    ON CONFLICT (user_id)
    DO UPDATE SET
      medium = EXCLUDED.medium,
      language = EXCLUDED.language,
      program_ids = EXCLUDED.program_ids,
      exam_city_ids = EXCLUDED.exam_city_ids,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, refs.programIds.slice(0, 1), refs.cityIds.slice(1, 3)]
  );

  await db.query(
    `INSERT INTO category_and_reservation (
      user_id, category_id, ews_status, pwbd_status, state_domicile, home_state_for_quota
    )
    VALUES ($1, $2, FALSE, FALSE, TRUE, 'Maharashtra')
    ON CONFLICT (user_id)
    DO UPDATE SET
      category_id = EXCLUDED.category_id,
      ews_status = EXCLUDED.ews_status,
      pwbd_status = EXCLUDED.pwbd_status,
      state_domicile = EXCLUDED.state_domicile,
      home_state_for_quota = EXCLUDED.home_state_for_quota,
      updated_at = CURRENT_TIMESTAMP`,
    [userId, refs.generalCategoryId || refs.ewsCategoryId]
  );
}

async function printSummary() {
  const [users, streams, subjects, programs, goals, exams] = await Promise.all([
    db.query(`SELECT COUNT(*)::int AS n FROM users WHERE email LIKE '%@unitracko.test'`),
    db.query(`SELECT COUNT(*)::int AS n FROM streams WHERE status = TRUE`),
    db.query(`SELECT COUNT(*)::int AS n FROM subjects WHERE status = TRUE`),
    db.query(`SELECT COUNT(*)::int AS n FROM programs WHERE status = TRUE`),
    db.query(`SELECT COUNT(*)::int AS n FROM career_goals_taxonomies WHERE status = TRUE`),
    db.query(`SELECT COUNT(*)::int AS n FROM exams_taxonomies`)
  ]);

  console.log('\nSample seed summary:');
  console.log(`- Demo users: ${users.rows[0].n}`);
  console.log(`- Active streams: ${streams.rows[0].n}`);
  console.log(`- Active subjects: ${subjects.rows[0].n}`);
  console.log(`- Active programs: ${programs.rows[0].n}`);
  console.log(`- Active interests: ${goals.rows[0].n}`);
  console.log(`- Exams: ${exams.rows[0].n}`);
}

async function main() {
  try {
    if (shouldReset) {
      console.log('Reset mode enabled: removing existing demo users first...');
      await resetDemoUsersOnly();
    }

    console.log('Seeding core taxonomy data...');
    await upsertTaxonomies();

    const refs = await getIdsForFlow();

    console.log('Seeding demo users and onboarding-linked profile data...');
    for (const user of DEMO_USERS) {
      const userId = await upsertDemoUserBasics(user);
      if (user.type === 'full') {
        await upsertFullFlowUser(userId, refs);
      } else {
        await upsertPartialFlowUser(userId, refs);
      }
      console.log(`- Upserted demo user: ${user.email}`);
    }

    await printSummary();
    console.log('\nDone. Sample data is ready for design and user-flow testing.');
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exitCode = 1;
  } finally {
    if (db.pool) {
      await db.pool.end();
    }
  }
}

main();
