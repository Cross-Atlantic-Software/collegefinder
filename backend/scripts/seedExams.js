/**
 * Seed Exams Taxonomies
 * 
 * This script populates the exams_taxonomies table with common exam options
 * Run with: npm run seed-exams
 */

require('dotenv').config();
const db = require('../config/database');
const Exam = require('../src/models/taxonomy/Exam');

const examsData = [
  { name: "JEE Main", code: "JEE_MAIN", description: "Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges" },
  { name: "JEE Advanced", code: "JEE_ADVANCED", description: "Joint Entrance Examination Advanced - for admission to IITs" },
  { name: "NEET", code: "NEET", description: "National Eligibility cum Entrance Test - for admission to medical and dental colleges" },
  { name: "CUET", code: "CUET", description: "Common University Entrance Test - for admission to central universities" },
  { name: "CLAT", code: "CLAT", description: "Common Law Admission Test - for admission to NLUs and other law colleges" },
  { name: "AILET", code: "AILET", description: "All India Law Entrance Test - for admission to NLU Delhi" },
  { name: "NATA", code: "NATA", description: "National Aptitude Test in Architecture - for admission to architecture colleges" },
  { name: "BITSAT", code: "BITSAT", description: "Birla Institute of Technology and Science Admission Test" },
  { name: "VITEEE", code: "VITEEE", description: "VIT Engineering Entrance Examination" },
  { name: "SRMJEEE", code: "SRMJEEE", description: "SRM Joint Engineering Entrance Examination" },
  { name: "WBJEE", code: "WBJEE", description: "West Bengal Joint Entrance Examination" },
  { name: "MHT CET", code: "MHT_CET", description: "Maharashtra Common Entrance Test" },
  { name: "KCET", code: "KCET", description: "Karnataka Common Entrance Test" },
  { name: "TNEA", code: "TNEA", description: "Tamil Nadu Engineering Admission" },
  { name: "AP EAMCET", code: "AP_EAMCET", description: "Andhra Pradesh Engineering, Agriculture and Medical Common Entrance Test" },
  { name: "TS EAMCET", code: "TS_EAMCET", description: "Telangana State Engineering, Agriculture and Medical Common Entrance Test" },
  { name: "Gujarat CET", code: "GUJCET", description: "Gujarat Common Entrance Test" },
  { name: "Rajasthan JEE", code: "RJEE", description: "Rajasthan Joint Entrance Examination" },
  { name: "UPSEE", code: "UPSEE", description: "Uttar Pradesh State Entrance Examination" },
  { name: "COMEDK", code: "COMEDK", description: "Consortium of Medical, Engineering and Dental Colleges of Karnataka" },
  { name: "KIITEE", code: "KIITEE", description: "KIIT Entrance Examination" },
  { name: "JIPMER", code: "JIPMER", description: "Jawaharlal Institute of Postgraduate Medical Education and Research Entrance Exam" },
  { name: "AIIMS", code: "AIIMS", description: "All India Institute of Medical Sciences Entrance Exam" },
  { name: "NEST", code: "NEST", description: "National Entrance Screening Test - for admission to NISER and CEBS" },
  { name: "IISER Aptitude Test", code: "IISER_APTITUDE", description: "Indian Institutes of Science Education and Research Aptitude Test" },
];

async function seedExams() {
  try {
    await db.init();
    console.log('✅ Database connected\n');

    console.log('🌱 Starting to seed exams...');
    let insertedCount = 0;
    let skippedCount = 0;

    for (const exam of examsData) {
      const existing = await Exam.findByCode(exam.code);
      if (existing) {
        console.log(`⏭️  Skipped "${exam.name}" (already exists)`);
        skippedCount++;
      } else {
        const newExam = await Exam.create(exam);
        console.log(`✅ Inserted "${newExam.name}" with ID: ${newExam.id}`);
        insertedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   ✅ Inserted: ${insertedCount}`);
    console.log(`   ⏭️  Skipped: ${skippedCount}`);
    console.log(`   📝 Total: ${examsData.length}`);

    await db.pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding exams:', error);
    await db.pool.end().catch(() => {});
    process.exit(1);
  }
}

seedExams();

