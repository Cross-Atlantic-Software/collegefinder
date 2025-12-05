/**
 * Seed Test Users
 * Creates 5 test users from India with varied data, career goals, and exam preferences
 */

require('dotenv').config();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const UserAcademics = require('../models/UserAcademics');
const UserCareerGoals = require('../models/UserCareerGoals');
const UserExamPreferences = require('../models/UserExamPreferences');

const testUsers = [
  {
    email: 'rahul.sharma@test.com',
    name: 'Rahul Sharma',
    first_name: 'Rahul',
    last_name: 'Sharma',
    date_of_birth: '2005-06-15',
    gender: 'male',
    phone_number: '+919876543210',
    state: 'Maharashtra',
    district: 'Mumbai',
    academics: {
      matric_board: 'CBSE',
      matric_school_name: 'Delhi Public School',
      matric_passing_year: 2021,
      matric_roll_number: 'CBSE2021/12345',
      matric_total_marks: 500,
      matric_obtained_marks: 450,
      matric_percentage: 90.0,
      matric_subjects: [
        { name: 'Mathematics', percent: 95, obtainedMarks: 95, totalMarks: 100 },
        { name: 'Science', percent: 92, obtainedMarks: 92, totalMarks: 100 },
        { name: 'English', percent: 88, obtainedMarks: 88, totalMarks: 100 },
        { name: 'Social Studies', percent: 90, obtainedMarks: 90, totalMarks: 100 },
        { name: 'Hindi', percent: 85, obtainedMarks: 85, totalMarks: 100 }
      ],
      postmatric_board: 'CBSE',
      postmatric_school_name: 'Delhi Public School',
      postmatric_passing_year: 2023,
      postmatric_roll_number: 'CBSE2023/12345',
      postmatric_total_marks: 500,
      postmatric_obtained_marks: 465,
      postmatric_percentage: 93.0,
      stream: 'PCM',
      subjects: [
        { name: 'Physics', percent: 94, obtainedMarks: 94, totalMarks: 100 },
        { name: 'Chemistry', percent: 92, obtainedMarks: 92, totalMarks: 100 },
        { name: 'Mathematics', percent: 96, obtainedMarks: 96, totalMarks: 100 },
        { name: 'English', percent: 90, obtainedMarks: 90, totalMarks: 100 }
      ],
      is_pursuing_12th: false
    },
    careerGoals: [1, 2], // Technology, Engineering
    examPreferences: {
      target_exams: [1, 2], // JEE Main, JEE Advanced
      previous_attempts: [
        { exam_id: 1, year: 2023, rank: 5000 }
      ]
    }
  },
  {
    email: 'priya.patel@test.com',
    name: 'Priya Patel',
    first_name: 'Priya',
    last_name: 'Patel',
    date_of_birth: '2005-08-22',
    gender: 'female',
    phone_number: '+919876543211',
    state: 'Gujarat',
    district: 'Ahmedabad',
    academics: {
      matric_board: 'GSEB',
      matric_school_name: 'Gujarat High School',
      matric_passing_year: 2021,
      matric_roll_number: 'GSEB2021/23456',
      matric_total_marks: 500,
      matric_obtained_marks: 440,
      matric_percentage: 88.0,
      matric_subjects: [
        { name: 'Mathematics', percent: 90, obtainedMarks: 90, totalMarks: 100 },
        { name: 'Science', percent: 88, obtainedMarks: 88, totalMarks: 100 },
        { name: 'English', percent: 85, obtainedMarks: 85, totalMarks: 100 },
        { name: 'Social Studies', percent: 87, obtainedMarks: 87, totalMarks: 100 },
        { name: 'Gujarati', percent: 90, obtainedMarks: 90, totalMarks: 100 }
      ],
      postmatric_board: 'GSEB',
      postmatric_school_name: 'Gujarat High School',
      postmatric_passing_year: 2023,
      postmatric_roll_number: 'GSEB2023/23456',
      postmatric_total_marks: 500,
      postmatric_obtained_marks: 455,
      postmatric_percentage: 91.0,
      stream: 'PCB',
      subjects: [
        { name: 'Physics', percent: 90, obtainedMarks: 90, totalMarks: 100 },
        { name: 'Chemistry', percent: 92, obtainedMarks: 92, totalMarks: 100 },
        { name: 'Biology', percent: 93, obtainedMarks: 93, totalMarks: 100 },
        { name: 'English', percent: 88, obtainedMarks: 88, totalMarks: 100 }
      ],
      is_pursuing_12th: false
    },
    careerGoals: [3, 12], // Medicine, Healthcare
    examPreferences: {
      target_exams: [3], // NEET
      previous_attempts: [
        { exam_id: 3, year: 2023, rank: 15000 }
      ]
    }
  },
  {
    email: 'arjun.kumar@test.com',
    name: 'Arjun Kumar',
    first_name: 'Arjun',
    last_name: 'Kumar',
    date_of_birth: '2006-03-10',
    gender: 'male',
    phone_number: '+919876543212',
    state: 'Karnataka',
    district: 'Bangalore',
    academics: {
      matric_board: 'KSEEB',
      matric_school_name: 'Karnataka Public School',
      matric_passing_year: 2022,
      matric_roll_number: 'KSEEB2022/34567',
      matric_total_marks: 500,
      matric_obtained_marks: 430,
      matric_percentage: 86.0,
      matric_subjects: [
        { name: 'Mathematics', percent: 88, obtainedMarks: 88, totalMarks: 100 },
        { name: 'Science', percent: 85, obtainedMarks: 85, totalMarks: 100 },
        { name: 'English', percent: 83, obtainedMarks: 83, totalMarks: 100 },
        { name: 'Social Studies', percent: 84, obtainedMarks: 84, totalMarks: 100 },
        { name: 'Kannada', percent: 90, obtainedMarks: 90, totalMarks: 100 }
      ],
      postmatric_board: 'KSEEB',
      postmatric_school_name: 'Karnataka Public School',
      postmatric_passing_year: null,
      postmatric_roll_number: null,
      postmatric_total_marks: null,
      postmatric_obtained_marks: null,
      postmatric_percentage: null,
      stream: 'PCM',
      subjects: [],
      is_pursuing_12th: true
    },
    careerGoals: [1, 4], // Technology, Business
    examPreferences: {
      target_exams: [1, 8], // JEE Main, BITSAT
      previous_attempts: []
    }
  },
  {
    email: 'ananya.singh@test.com',
    name: 'Ananya Singh',
    first_name: 'Ananya',
    last_name: 'Singh',
    date_of_birth: '2005-11-05',
    gender: 'female',
    phone_number: '+919876543213',
    state: 'Delhi',
    district: 'New Delhi',
    academics: {
      matric_board: 'CBSE',
      matric_school_name: 'Delhi Public School',
      matric_passing_year: 2021,
      matric_roll_number: 'CBSE2021/45678',
      matric_total_marks: 500,
      matric_obtained_marks: 420,
      matric_percentage: 84.0,
      matric_subjects: [
        { name: 'Mathematics', percent: 85, obtainedMarks: 85, totalMarks: 100 },
        { name: 'Science', percent: 82, obtainedMarks: 82, totalMarks: 100 },
        { name: 'English', percent: 88, obtainedMarks: 88, totalMarks: 100 },
        { name: 'Social Studies', percent: 80, obtainedMarks: 80, totalMarks: 100 },
        { name: 'Hindi', percent: 85, obtainedMarks: 85, totalMarks: 100 }
      ],
      postmatric_board: 'CBSE',
      postmatric_school_name: 'Delhi Public School',
      postmatric_passing_year: 2023,
      postmatric_roll_number: 'CBSE2023/45678',
      postmatric_total_marks: 500,
      postmatric_obtained_marks: 440,
      postmatric_percentage: 88.0,
      stream: 'Commerce',
      subjects: [
        { name: 'Accountancy', percent: 90, obtainedMarks: 90, totalMarks: 100 },
        { name: 'Business Studies', percent: 88, obtainedMarks: 88, totalMarks: 100 },
        { name: 'Economics', percent: 85, obtainedMarks: 85, totalMarks: 100 },
        { name: 'English', percent: 87, obtainedMarks: 87, totalMarks: 100 },
        { name: 'Mathematics', percent: 90, obtainedMarks: 90, totalMarks: 100 }
      ],
      is_pursuing_12th: false
    },
    careerGoals: [4, 10], // Business, Finance
    examPreferences: {
      target_exams: [4], // CUET
      previous_attempts: []
    }
  },
  {
    email: 'vikram.reddy@test.com',
    name: 'Vikram Reddy',
    first_name: 'Vikram',
    last_name: 'Reddy',
    date_of_birth: '2005-01-18',
    gender: 'male',
    phone_number: '+919876543214',
    state: 'Telangana',
    district: 'Hyderabad',
    academics: {
      matric_board: 'TSBSE',
      matric_school_name: 'Telangana State School',
      matric_passing_year: 2021,
      matric_roll_number: 'TSBSE2021/56789',
      matric_total_marks: 500,
      matric_obtained_marks: 460,
      matric_percentage: 92.0,
      matric_subjects: [
        { name: 'Mathematics', percent: 95, obtainedMarks: 95, totalMarks: 100 },
        { name: 'Science', percent: 93, obtainedMarks: 93, totalMarks: 100 },
        { name: 'English', percent: 90, obtainedMarks: 90, totalMarks: 100 },
        { name: 'Social Studies', percent: 91, obtainedMarks: 91, totalMarks: 100 },
        { name: 'Telugu', percent: 91, obtainedMarks: 91, totalMarks: 100 }
      ],
      postmatric_board: 'TSBSE',
      postmatric_school_name: 'Telangana State School',
      postmatric_passing_year: 2023,
      postmatric_roll_number: 'TSBSE2023/56789',
      postmatric_total_marks: 500,
      postmatric_obtained_marks: 470,
      postmatric_percentage: 94.0,
      stream: 'PCM',
      subjects: [
        { name: 'Physics', percent: 95, obtainedMarks: 95, totalMarks: 100 },
        { name: 'Chemistry', percent: 94, obtainedMarks: 94, totalMarks: 100 },
        { name: 'Mathematics', percent: 96, obtainedMarks: 96, totalMarks: 100 },
        { name: 'English', percent: 92, obtainedMarks: 92, totalMarks: 100 }
      ],
      is_pursuing_12th: false
    },
    careerGoals: [2, 13], // Engineering, Architecture
    examPreferences: {
      target_exams: [1, 2, 7], // JEE Main, JEE Advanced, NATA
      previous_attempts: [
        { exam_id: 1, year: 2023, rank: 2000 },
        { exam_id: 2, year: 2023, rank: 5000 }
      ]
    }
  }
];

async function seedTestUsers() {
  try {
    await db.init();
    console.log('✅ Database connected\n');

    // First, get career goals and exams IDs
    const careerGoalsResult = await db.query('SELECT id, label FROM career_goals_taxonomies ORDER BY id');
    const examsResult = await db.query('SELECT id, name FROM exams_taxonomies ORDER BY id');

    if (careerGoalsResult.rows.length === 0) {
      console.log('⚠️  No career goals found. Please run seedCareerGoals.js first.');
      process.exit(1);
    }

    if (examsResult.rows.length === 0) {
      console.log('⚠️  No exams found. Please run seedExams.js first.');
      process.exit(1);
    }

    console.log('📋 Available Career Goals:');
    careerGoalsResult.rows.forEach(cg => {
      console.log(`   ${cg.id}: ${cg.label}`);
    });

    console.log('\n📋 Available Exams:');
    examsResult.rows.forEach(exam => {
      console.log(`   ${exam.id}: ${exam.name}`);
    });

    console.log('\n🌱 Starting to seed test users...\n');

    let created = 0;
    let skipped = 0;

    for (const userData of testUsers) {
      try {
        // Check if user already exists
        const existingUser = await db.query(
          'SELECT id FROM users WHERE email = $1',
          [userData.email]
        );

        if (existingUser.rows.length > 0) {
          console.log(`⏭️  Skipping "${userData.name}" - user already exists`);
          skipped++;
          continue;
        }

        // Create user (without password - they'll need to use OTP to login)
        const userResult = await db.query(
          `INSERT INTO users (email, name, first_name, last_name, date_of_birth, gender, phone_number, state, district, email_verified, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
           RETURNING id`,
          [
            userData.email,
            userData.name,
            userData.first_name,
            userData.last_name,
            userData.date_of_birth,
            userData.gender,
            userData.phone_number,
            userData.state,
            userData.district,
            true // Mark as verified for test users
          ]
        );

        const userId = userResult.rows[0].id;
        console.log(`✅ Created user: ${userData.name} (ID: ${userId})`);

        // Create academics
        if (userData.academics) {
          await UserAcademics.upsert(userId, userData.academics);
          console.log(`   📚 Added academics data`);
        }

        // Create career goals
        if (userData.careerGoals && userData.careerGoals.length > 0) {
          await UserCareerGoals.upsert(userId, { interests: userData.careerGoals });
          const goalLabels = userData.careerGoals.map(id => {
            const goal = careerGoalsResult.rows.find(cg => cg.id === id);
            return goal ? goal.label : `ID ${id}`;
          }).join(', ');
          console.log(`   🎯 Added career goals: ${goalLabels}`);
        }

        // Create exam preferences
        if (userData.examPreferences) {
          const examIds = userData.examPreferences.target_exams || [];
          const previousAttempts = userData.examPreferences.previous_attempts || [];
          await UserExamPreferences.upsert(userId, {
            target_exams: examIds,
            previous_attempts: previousAttempts
          });
          const examNames = examIds.map(id => {
            const exam = examsResult.rows.find(e => e.id === id);
            return exam ? exam.name : `ID ${id}`;
          }).join(', ');
          console.log(`   📝 Added exam preferences: ${examNames}`);
        }

        created++;
        console.log('');
      } catch (error) {
        console.error(`❌ Error creating user "${userData.name}":`, error.message);
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📝 Total: ${testUsers.length}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding test users:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

seedTestUsers();

