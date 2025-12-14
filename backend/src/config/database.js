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
    
    // Define schema files in execution order
    const schemaFiles = [
      'functions.sql',        // Functions must be loaded first
      'users.sql',            // Base users table
      'otps.sql',             // OTP table (depends on users)
      'admin_users.sql',      // Admin users table (self-referencing)
      'email_templates.sql',  // Email templates table
      'blogs.sql',            // Blogs table
      'career_goals.sql',     // Career goals taxonomies table (renamed from career_goals)
      'exams.sql',            // Exams taxonomies table
      'subjects.sql',         // Subjects taxonomies table
      'streams.sql',          // Streams taxonomies table
      'careers.sql',          // Careers taxonomies table
      'topics.sql',           // Topics table (depends on subjects)
      'subtopics.sql',        // Subtopics table (depends on topics)
      'lectures.sql',         // Lectures table (depends on subtopics)
      'purposes.sql',         // Purposes table and lecture_purposes junction table
      'levels.sql',           // Levels taxonomy table
      'programs.sql',         // Programs taxonomy table
      'categories.sql',       // Categories taxonomy table
      'colleges.sql',         // Colleges table
      'college_location.sql', // College locations table (depends on colleges)
      'college_gallery.sql',  // College gallery table (depends on colleges)
      'college_reviews.sql',  // College reviews table (depends on colleges and users)
      'college_news.sql',     // College news table (depends on colleges)
      'college_courses.sql', // College courses table (depends on colleges, streams, levels, programs)
      'course_exams.sql',     // Course exams table (depends on college_courses)
      'course_cutoffs.sql',   // Course cutoffs table (depends on college_courses and course_exams)
      'course_subjects.sql',  // Course subjects table (depends on college_courses and subjects)
      'college_faqs.sql',     // College FAQs table (depends on colleges)
      'user_academics.sql',   // User academics table (depends on users)
      'user_career_goals.sql', // User career goals table (depends on users)
      'user_exam_preferences.sql' // User exam preferences table (depends on users and exams)
    ];

    // Execute each schema file in order
    for (const file of schemaFiles) {
      const filePath = path.join(dbDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      await pool.query(sql);
      console.log(`✅ Loaded schema: ${file}`);
    }
    
    console.log('✅ Database tables initialized');
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

