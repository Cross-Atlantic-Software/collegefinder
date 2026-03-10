/**
 * Seed 3 exams into exams_taxonomies: JEE Main, JEE Advanced, NEET.
 * Safe to re-run (uses ON CONFLICT DO NOTHING on code).
 *
 * Run from repo root: node backend/scripts/seedThreeExams.js
 * Or from backend: npm run seed-three-exams
 */

require('dotenv').config();
const db = require('../src/config/database');

const EXAMS = [
  {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    description: 'Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges',
    format: {
      name: 'JEE Main 2024',
      duration: 10800,
      total_questions: 90,
      total_marks: 300,
      marking_scheme: {
        correct: 4,
        incorrect: -1,
        unattempted: 0,
      },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Total questions: 90 (75 MCQs + 15 Numerical)',
        'Maximum marks: 300',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'Section A (MCQ): Choose one correct option',
        'Section B (Numerical): Answer must be a number between 0-9999',
        'Calculator and rough sheets allowed',
        'No negative marking for numerical questions',
      ],
      sections: {
        Physics: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
        Chemistry: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
        Mathematics: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
      },
    },
  },
  {
    name: 'JEE Advanced',
    code: 'JEE_ADVANCED',
    description: 'Joint Entrance Examination Advanced - for admission to IITs',
    format: {
      name: 'JEE Advanced 2024',
      duration: 10800,
      total_questions: 54,
      total_marks: 264,
      marking_scheme: {
        correct: 4,
        incorrect: -1,
        unattempted: 0,
      },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Total questions: 54 across two papers',
        'Maximum marks: 264',
        'Marking varies by question type',
        'Negative marking applicable',
        'Partial marking in some questions',
      ],
      sections: {
        'Physics': {
          total_questions: 18,
          subsections: {
            'Section 1': { type: 'mcq_single', count: 6, required: 6 },
            'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
            'Section 3': { type: 'numerical', count: 6, required: 6 },
          },
        },
        'Chemistry': {
          total_questions: 18,
          subsections: {
            'Section 1': { type: 'mcq_single', count: 6, required: 6 },
            'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
            'Section 3': { type: 'numerical', count: 6, required: 6 },
          },
        },
        'Mathematics': {
          total_questions: 18,
          subsections: {
            'Section 1': { type: 'mcq_single', count: 6, required: 6 },
            'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
            'Section 3': { type: 'numerical', count: 6, required: 6 },
          },
        },
      },
    },
  },
  {
    name: 'NEET',
    code: 'NEET',
    description: 'National Eligibility cum Entrance Test - for admission to medical and dental colleges',
    format: {
      name: 'NEET 2024',
      duration: 10800,
      total_questions: 200,
      total_marks: 720,
      marking_scheme: {
        correct: 4,
        incorrect: -1,
        unattempted: 0,
      },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Total questions: 200 (180 to be attempted)',
        'Maximum marks: 720',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'All questions are multiple choice with single correct answer',
        'No negative marking for unattempted questions',
        'Pen and paper based exam',
      ],
      sections: {
        'Physics': {
          total_questions: 50,
          subsections: {
            'Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
        'Chemistry': {
          total_questions: 50,
          subsections: {
            'Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
        'Biology': {
          total_questions: 100,
          subsections: {
            'Botany - Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Botany - Section B': { type: 'mcq_single', count: 15, required: 10 },
            'Zoology - Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Zoology - Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
      },
    },
  },
];

async function main() {
  try {
    console.log('🌱 Seeding exams_taxonomies with 3 exams...\n');

    for (const exam of EXAMS) {
      const result = await db.query(
        `INSERT INTO exams_taxonomies (name, code, description, format)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (code) 
         DO UPDATE SET 
           name = EXCLUDED.name,
           description = EXCLUDED.description,
           format = EXCLUDED.format
         RETURNING id, name, code`,
        [exam.name, exam.code, exam.description, JSON.stringify(exam.format)]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ ${result.rows[0].name} (${result.rows[0].code}) - ID: ${result.rows[0].id}`);
      }
    }

    console.log('\n📊 Current exams in database:');
    const allExams = await db.query('SELECT id, name, code FROM exams_taxonomies ORDER BY id');
    allExams.rows.forEach((row) => {
      console.log(`   ${row.id}: ${row.name} (${row.code})`);
    });
    
    console.log('\n✨ Done! Successfully seeded exams with formats.');
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
