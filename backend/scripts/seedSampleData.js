/**
 * Seed realistic sample data for design and user-flow testing.
 *
 * This script is idempotent and can be run multiple times safely.
 * Run from backend folder:
 *   npm run seed:sample
 * Or from repo root:
 *   node backend/scripts/seedSampleData.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const STREAMS = [
  'Science (PCM)',
  'Science (PCB)',
  'Commerce',
  'Arts/Humanities',
  'Computer Science',
];

const CAREER_GOALS = [
  { label: 'Engineering', description: 'Build a career in core or software engineering.' },
  { label: 'Medical', description: 'Pursue MBBS, BDS, or allied healthcare tracks.' },
  { label: 'Civil Services', description: 'Prepare for UPSC and government exams.' },
  { label: 'Design', description: 'Explore product, UI/UX, and visual communication.' },
  { label: 'Business & Management', description: 'Focus on management and entrepreneurship.' },
];

const PROGRAMS = ['B.Tech', 'MBBS', 'BCA', 'BBA', 'BA'];
const CATEGORIES = ['General', 'OBC-NCL', 'SC', 'ST', 'EWS'];
const EXAM_CITIES = ['Delhi', 'Mumbai', 'Bengaluru', 'Hyderabad', 'Kolkata', 'Patna'];
const CAREERS = ['Software Engineer', 'Doctor', 'Data Analyst', 'Civil Servant', 'Product Designer'];

const EXAMS = [
  {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    description: 'Joint Entrance Examination Main',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    website: 'https://jeemain.nta.nic.in/',
    format: {
      default: {
        name: 'JEE Main',
        duration_minutes: 180,
        total_questions: 90,
        total_marks: 300,
      },
    },
  },
  {
    name: 'JEE Advanced',
    code: 'JEE_ADVANCED',
    description: 'Joint Entrance Examination Advanced',
    exam_type: 'National',
    conducting_authority: 'IIT',
    number_of_papers: 2,
    website: 'https://jeeadv.ac.in/',
    format: {
      paper1: { name: 'Paper 1', duration_minutes: 180, total_questions: 54, total_marks: 264 },
      paper2: { name: 'Paper 2', duration_minutes: 180, total_questions: 54, total_marks: 264 },
    },
  },
  {
    name: 'NEET',
    code: 'NEET',
    description: 'National Eligibility cum Entrance Test',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    website: 'https://neet.nta.nic.in/',
    format: {
      default: {
        name: 'NEET',
        duration_minutes: 180,
        total_questions: 200,
        total_marks: 720,
      },
    },
  },
  {
    name: 'CUET',
    code: 'CUET',
    description: 'Common University Entrance Test',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    website: 'https://cuet.nta.nic.in/',
    format: {
      default: {
        name: 'CUET (UG)',
        duration_minutes: 180,
        total_questions: 50,
        total_marks: 200,
      },
    },
  },
];

const SUBJECTS = [
  { name: 'Mathematics', streamNames: ['Science (PCM)', 'Commerce', 'Computer Science'] },
  { name: 'Physics', streamNames: ['Science (PCM)'] },
  { name: 'Chemistry', streamNames: ['Science (PCM)', 'Science (PCB)'] },
  { name: 'Biology', streamNames: ['Science (PCB)'] },
  { name: 'Computer Science', streamNames: ['Science (PCM)', 'Computer Science'] },
  { name: 'English', streamNames: ['Science (PCM)', 'Science (PCB)', 'Commerce', 'Arts/Humanities'] },
  { name: 'Economics', streamNames: ['Commerce', 'Arts/Humanities'] },
  { name: 'History', streamNames: ['Arts/Humanities'] },
];

const SAMPLE_USERS = [
  {
    user_code: 'UT10000001',
    email: 'demo.pcm@student.com',
    name: 'Aarav Sharma',
    first_name: 'Aarav',
    last_name: 'Sharma',
    streamName: 'Science (PCM)',
    city: 'Delhi',
    district: 'New Delhi',
    state: 'Delhi',
    pincode: '110001',
    interests: ['Engineering', 'Design'],
    targetExams: ['JEE_MAIN', 'JEE_ADVANCED'],
    category: 'General',
    programs: ['B.Tech', 'BCA'],
    examCities: ['Delhi', 'Kolkata'],
    phone: '+91-9000000001',
  },
  {
    user_code: 'UT10000002',
    email: 'demo.pcb@student.com',
    name: 'Ishita Verma',
    first_name: 'Ishita',
    last_name: 'Verma',
    streamName: 'Science (PCB)',
    city: 'Patna',
    district: 'Patna',
    state: 'Bihar',
    pincode: '800001',
    interests: ['Medical'],
    targetExams: ['NEET'],
    category: 'OBC-NCL',
    programs: ['MBBS'],
    examCities: ['Patna', 'Delhi'],
    phone: '+91-9000000002',
  },
  {
    user_code: 'UT10000003',
    email: 'demo.commerce@student.com',
    name: 'Rohan Gupta',
    first_name: 'Rohan',
    last_name: 'Gupta',
    streamName: 'Commerce',
    city: 'Mumbai',
    district: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    interests: ['Business & Management', 'Civil Services'],
    targetExams: ['CUET'],
    category: 'EWS',
    programs: ['BBA', 'BA'],
    examCities: ['Mumbai', 'Bengaluru'],
    phone: '+91-9000000003',
  },
];

async function upsertSimpleNameTable(client, tableName, names, withStatus = true) {
  for (const name of names) {
    if (withStatus) {
      await client.query(
        `INSERT INTO ${tableName} (name, status)
         VALUES ($1, TRUE)
         ON CONFLICT (name)
         DO UPDATE SET status = TRUE, updated_at = CURRENT_TIMESTAMP`,
        [name]
      );
    } else {
      await client.query(
        `INSERT INTO ${tableName} (name)
         VALUES ($1)
         ON CONFLICT (name)
         DO NOTHING`,
        [name]
      );
    }
  }
}

async function mapIdByName(client, tableName) {
  const result = await client.query(`SELECT id, name FROM ${tableName}`);
  const out = new Map();
  result.rows.forEach((r) => out.set(r.name, r.id));
  return out;
}

async function mapExamIdByCode(client) {
  const result = await client.query('SELECT id, code FROM exams_taxonomies');
  const out = new Map();
  result.rows.forEach((r) => out.set(r.code, r.id));
  return out;
}

async function upsertUsersAndProfiles(client, refs) {
  let createdOrUpdated = 0;

  for (const u of SAMPLE_USERS) {
    const userResult = await client.query(
      `INSERT INTO users (
          user_code, email, name, first_name, last_name, phone_number, state, district,
          email_verified, auth_provider, onboarding_completed
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, 'email', TRUE)
       ON CONFLICT (email)
       DO UPDATE SET
         user_code = COALESCE(users.user_code, EXCLUDED.user_code),
         name = EXCLUDED.name,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         phone_number = EXCLUDED.phone_number,
         state = EXCLUDED.state,
         district = EXCLUDED.district,
         email_verified = TRUE,
         onboarding_completed = TRUE,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id`,
      [u.user_code, u.email, u.name, u.first_name, u.last_name, u.phone, u.state, u.district]
    );
    const userId = userResult.rows[0].id;

    const streamId = refs.streamIds.get(u.streamName) || null;
    const categoryId = refs.categoryIds.get(u.category) || null;
    const interestIds = u.interests.map((x) => refs.careerGoalIds.get(x)).filter(Boolean);
    const targetExamIds = u.targetExams.map((x) => refs.examIds.get(x)).filter(Boolean);
    const programIds = u.programs.map((x) => refs.programIds.get(x)).filter(Boolean);
    const examCityIds = u.examCities.map((x) => refs.examCityIds.get(x)).filter(Boolean);

    await client.query(
      `INSERT INTO user_academics (
          user_id, stream, stream_id, matric_passing_year, postmatric_passing_year,
          is_pursuing_12th, matric_percentage, postmatric_percentage
       )
       VALUES ($1, $2, $3, 2021, 2023, FALSE, 92.5, 89.1)
       ON CONFLICT (user_id)
       DO UPDATE SET
         stream = EXCLUDED.stream,
         stream_id = EXCLUDED.stream_id,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, u.streamName, streamId]
    );

    await client.query(
      `INSERT INTO user_career_goals (user_id, interests)
       VALUES ($1, $2::int[])
       ON CONFLICT (user_id)
       DO UPDATE SET interests = EXCLUDED.interests, updated_at = CURRENT_TIMESTAMP`,
      [userId, interestIds]
    );

    await client.query(
      `INSERT INTO user_address (
          user_id, correspondence_address_line1, city_town_village, district, state, country,
          pincode, permanent_address_same_as_correspondence
       )
       VALUES ($1, $2, $3, $4, $5, 'India', $6, TRUE)
       ON CONFLICT (user_id)
       DO UPDATE SET
         correspondence_address_line1 = EXCLUDED.correspondence_address_line1,
         city_town_village = EXCLUDED.city_town_village,
         district = EXCLUDED.district,
         state = EXCLUDED.state,
         pincode = EXCLUDED.pincode,
         permanent_address_same_as_correspondence = EXCLUDED.permanent_address_same_as_correspondence,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, 'House 12, Demo Street', u.city, u.district, u.state, u.pincode]
    );

    await client.query(
      `INSERT INTO user_exam_preferences (user_id, target_exams, previous_attempts)
       VALUES ($1, $2::int[], $3::jsonb)
       ON CONFLICT (user_id)
       DO UPDATE SET
         target_exams = EXCLUDED.target_exams,
         previous_attempts = EXCLUDED.previous_attempts,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, targetExamIds, JSON.stringify([])]
    );

    await client.query(
      `INSERT INTO category_and_reservation (
          user_id, category_id, ews_status, pwbd_status, state_domicile, home_state_for_quota
       )
       VALUES ($1, $2, $3, FALSE, TRUE, $4)
       ON CONFLICT (user_id)
       DO UPDATE SET
         category_id = EXCLUDED.category_id,
         ews_status = EXCLUDED.ews_status,
         state_domicile = EXCLUDED.state_domicile,
         home_state_for_quota = EXCLUDED.home_state_for_quota,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, categoryId, u.category === 'EWS', u.state]
    );

    await client.query(
      `INSERT INTO user_other_info (user_id, medium, language, program_ids, exam_city_ids)
       VALUES ($1, 'English', 'English', $2::int[], $3::int[])
       ON CONFLICT (user_id)
       DO UPDATE SET
         medium = EXCLUDED.medium,
         language = EXCLUDED.language,
         program_ids = EXCLUDED.program_ids,
         exam_city_ids = EXCLUDED.exam_city_ids,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, programIds, examCityIds]
    );

    createdOrUpdated += 1;
  }

  return createdOrUpdated;
}

async function seedExams(client) {
  for (const exam of EXAMS) {
    await client.query(
      `INSERT INTO exams_taxonomies
        (name, code, description, exam_type, conducting_authority, format, number_of_papers, website)
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
        exam.website,
      ]
    );
  }
}

async function seedCareerGoals(client) {
  for (const cg of CAREER_GOALS) {
    await client.query(
      `INSERT INTO career_goals_taxonomies (label, description, status)
       VALUES ($1, $2, TRUE)
       ON CONFLICT (label)
       DO UPDATE SET
         description = EXCLUDED.description,
         status = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [cg.label, cg.description]
    );
  }
}

async function seedSubjects(client, streamIds) {
  for (const s of SUBJECTS) {
    const streamIdArray = s.streamNames.map((name) => streamIds.get(name)).filter(Boolean);
    await client.query(
      `INSERT INTO subjects (name, streams, status)
       VALUES ($1, $2::jsonb, TRUE)
       ON CONFLICT (name)
       DO UPDATE SET
         streams = EXCLUDED.streams,
         status = TRUE,
         updated_at = CURRENT_TIMESTAMP`,
      [s.name, JSON.stringify(streamIdArray)]
    );
  }
}

async function main() {
  const client = await db.pool.connect();

  try {
    console.log('Seeding sample data for design and flow testing...');
    await client.query('BEGIN');

    await upsertSimpleNameTable(client, 'streams', STREAMS, true);
    await seedCareerGoals(client);
    await upsertSimpleNameTable(client, 'programs', PROGRAMS, true);
    await upsertSimpleNameTable(client, 'categories', CATEGORIES, false);
    await upsertSimpleNameTable(client, 'exam_city', EXAM_CITIES, true);
    await upsertSimpleNameTable(client, 'careers', CAREERS, true);
    await seedExams(client);

    const streamIds = await mapIdByName(client, 'streams');
    await seedSubjects(client, streamIds);

    const refs = {
      streamIds,
      careerGoalIds: await (async () => {
        const r = await client.query('SELECT id, label FROM career_goals_taxonomies');
        const m = new Map();
        r.rows.forEach((x) => m.set(x.label, x.id));
        return m;
      })(),
      programIds: await mapIdByName(client, 'programs'),
      categoryIds: await mapIdByName(client, 'categories'),
      examCityIds: await mapIdByName(client, 'exam_city'),
      examIds: await mapExamIdByCode(client),
    };

    const usersAffected = await upsertUsersAndProfiles(client, refs);
    await client.query('COMMIT');

    console.log('Sample data seed completed successfully.');
    console.log(`Users upserted: ${usersAffected}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Sample data seed failed:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.pool.end();
  }
}

main();
