const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'collegefinder_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Configure JSONB type handling
// Note: pg library automatically parses JSONB to JavaScript objects/arrays
// We don't need to override the default parser, but we handle parsing in controllers/models
// If you need custom parsing, uncomment below:
// const types = require('pg').types;
// types.setTypeParser(3802, (val) => {
//   return val ? JSON.parse(val) : null;
// });

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Initialize database tables
const init = async () => {
  try {
    const dbDir = path.join(__dirname, '../database/schema');
    const migrationsDir = path.join(__dirname, '../database/migrations');

    // Run schema fixes first (for existing DBs with older schema)
    const fixCollegesPath = path.join(migrationsDir, 'fix_colleges_college_name.sql');
    if (fs.existsSync(fixCollegesPath)) {
      try {
        const sql = fs.readFileSync(fixCollegesPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Applied schema fix: fix_colleges_college_name.sql');
      } catch (e) {
        if (e.code !== '42P07') console.log('ℹ️  Schema fix skipped:', e.message);
      }
    }

    // Define schema files in execution order
    const schemaFiles = [
      'functions.sql',        // Functions must be loaded first
      'users.sql',            // Base users table
      'otps.sql',             // OTP table (depends on users)
      'admin_users.sql',      // Admin users table (self-referencing)
      'modules.sql',          // Modules taxonomy (for admin role-based access)
      'admin_user_modules.sql', // Admin user -> module assignment (data_entry/admin)
      'email_templates.sql',  // Email templates table
      'blogs.sql',            // Blogs table
      'career_goals.sql',     // Career goals taxonomies table (renamed from career_goals)
      'exams.sql',            // Exams taxonomies table
      'tests.sql',            // Tests table (depends on exams)
      'questions.sql',        // Questions table (depends on exams)
      'subjects.sql',         // Subjects taxonomies table
      'streams.sql',          // Streams taxonomies table
      'careers.sql',          // Careers taxonomies table
      'topics.sql',           // Topics table (depends on subjects)
      'subtopics.sql',        // Subtopics table (depends on topics)
      'lectures.sql',         // Lectures table (depends on subtopics)
      'purposes.sql',         // Purposes table and lecture_purposes junction table
      'levels.sql',           // Levels taxonomy table
      'programs.sql',         // Programs taxonomy table
      'branches.sql',         // Branches / Courses taxonomy table
      'exam_city.sql',        // Exam city taxonomy table
      'categories.sql',       // Categories taxonomy table
      'colleges.sql',         // Colleges module (colleges + college_details + college_programs + cutoffs + seat_matrix + key_dates + documents + counselling + recommended_exams)
      'institutes.sql',       // Institutes (Coachings) module: institutes + institute_details + institute_exams + institute_exam_specialization + institute_statistics + institute_courses
      'scholarships.sql',     // Scholarships module: scholarships + eligible_categories + applicable_states + documents_required + scholarship_exams
      'loans.sql',            // Loans module: loan_providers + disbursement_process + eligible_countries + eligible_course_types
      'user_address.sql',      // User address table (depends on users)
      'government_identification.sql', // Government ID table (depends on users)
      'other_personal_details.sql', // Other personal details (depends on users)
      'user_academics.sql',   // User academics table (depends on users)
      'user_career_goals.sql', // User career goals table (depends on users)
      'user_exam_preferences.sql', // User exam preferences table (depends on users and exams)
      'category_and_reservation.sql', // Category and reservation table (depends on users, categories)
      'user_other_info.sql',   // User other info table (depends on users, programs, exam_city)
      'user_document_vault.sql', // User document vault table (depends on users)
      'mock_tests.sql',       // exam_mocks (depends on exams)
      'test_attempts.sql',    // user_exam_attempts (depends on users, tests, exams, exam_mocks)
      'mock_questions.sql',   // exam_mock_questions (depends on exam_mocks, questions, exams)
      'question_attempts.sql', // user_attempt_answers (depends on users, questions, user_exam_attempts, exams, exam_mocks)
      // Automation tables (for python-backend PostgreSQL integration)
      'automation_exams.sql',       // Automation exam configurations
      'automation_sessions.sql',    // Automation workflow sessions (depends on automation_exams, users)
      'automation_applications.sql', // Automation application queue (depends on automation_exams, users, admin_users, automation_sessions)
      'strength_payments.sql',       // Strength payment status (depends on users)
      'strength_results.sql',        // Strength analysis results (depends on users, admin_users)
      'admission_experts.sql',        // Admission help experts (depends on admin_users)
      'referral_codes.sql'            // Referral codes on users + institutes
    ];

    // Execute each schema file in order
    for (const file of schemaFiles) {
      const filePath = path.join(dbDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`✅ Loaded schema: ${file}`);
    }

    console.log('✅ Database tables initialized');

    // Run migrations
    await runMigrations();
  } catch (error) {
    // If tables already exist, that's okay
    if (error.code === '42P07') {
      console.log('ℹ️  Database tables already exist');
    }
    // If trigger already exists, that's okay too (shouldn't happen with DROP IF EXISTS, but just in case)
    else if (error.code === '42710') {
      console.log('ℹ️  Database triggers already exist');
    } else {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }
};

// Run database migrations
const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '../database/migrations');
  const migrationFiles = [
    'update_government_identification_apaar_id.sql',
    'add_description_status_to_career_goals.sql',
    'add_exam_fields_and_related_tables.sql',
    'add_institutes_tables.sql',
    'add_scholarships_tables.sql',
    'add_loans_tables.sql',
    'add_modules_and_admin_user_types.sql',
    'add_college_program_duration.sql',
    'add_career_programs.sql',
    'add_logo_file_name_to_exams.sql',
    'add_logo_filename_to_entities.sql',
    'add_updated_by_to_streams.sql',
    'add_updated_by_and_nullable_logo_to_career_goals.sql',
    'add_exam_domicile_programs.sql',
    'add_branch_to_college_seat_matrix.sql',
    'add_branch_to_college_cutoffs.sql',
    'rename_career_goals_to_interests_module.sql',
    'create_exam_mock_prompts_table.sql',
    'add_total_mocks_generated_to_exams.sql',
    'add_topic_subtopic_exams_and_purpose_description.sql',
    'add_multi_paper_support.sql',
    'add_strengths_and_experts.sql',
    'widen_expert_photo_and_strength_report.sql',
    'add_expert_phone_email_description.sql',
    'add_website_to_exams.sql',
    'restructure_colleges_programs.sql',
    'add_branch_id_to_college_programs.sql',
    'add_institute_referral_contact_email.sql',
    'add_referral_uses_table.sql',
    'add_institute_google_maps_link.sql',
    'add_lecture_taxonomies_thumbnail_filename.sql',
    'add_landing_page_content.sql'
  ];

  console.log('\n🔄 Running database migrations...\n');

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Migration file not found: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(filePath, 'utf8');
    const cleanedSql = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .trim();

    try {
      // If file contains dollar-quoted blocks (e.g. DO $$ ... END $$), run entire file as one script
      // so that semicolons inside the block don't break the migration
      if (cleanedSql.includes('$$')) {
        await pool.query(cleanedSql);
      } else {
        const statements = cleanedSql
          .split(';')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        for (const statement of statements) {
          if (statement.trim()) {
            await pool.query(statement);
          }
        }
      }
      console.log(`✅ Migration: ${file}`);
    } catch (error) {
      if (error.code === '42P07' || error.code === '42701' ||
        error.message.includes('already exists') ||
        error.message.includes('duplicate key') ||
        error.message.includes('IF NOT EXISTS') ||
        error.message.includes('relation already exists') ||
        error.message.includes('constraint') ||
        error.message.includes('column') ||
        error.message.includes('does not exist')) {
        console.log(`ℹ️  Migration ${file} - Already applied or skipped (${error.message})`);
      } else {
        console.error(`❌ Migration ${file} failed:`, error.message);
        console.error(`   Error code: ${error.code}`);
      }
    }
  }

  console.log('✅ Migrations check completed\n');
};

// Query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    return res;
  } catch (error) {
    console.error('Query error', { text, error: error.message });
    throw error;
  }
};

module.exports = {
  pool,
  query,
  init
};

