/**
 * Seed proper format configuration for every exam in exams_taxonomies.
 * Updates the format JSONB column so the frontend and mock generator get sections, duration, marking_scheme, rules.
 *
 * Run from repo root: node backend/scripts/seedExamFormats.js
 * Or from backend: npm run seed-exam-formats
 */

require('dotenv').config();
const db = require('../src/config/database');
const Exam = require('../src/models/taxonomy/Exam');

// Format configs keyed by exam code. Each value is the full format object { formatId: { name, duration_minutes, sections, marking_scheme, rules } }
const FORMATS_BY_CODE = {
  JEE_MAIN: {
    jee_main_paper1: {
      format_id: 'jee_main_paper1',
      name: 'JEE Main Paper 1 (BE/BTech)',
      duration_minutes: 180,
      total_marks: 300,
      sections: {
        mathematics: {
          name: 'Mathematics',
          marks: 100,
          subsections: {
            section_a: { type: 'MCQ', questions: 20, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 5, marks_per_question: 4 }
          }
        },
        physics: {
          name: 'Physics',
          marks: 100,
          subsections: {
            section_a: { type: 'MCQ', questions: 20, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 5, marks_per_question: 4 }
          }
        },
        chemistry: {
          name: 'Chemistry',
          marks: 100,
          subsections: {
            section_a: { type: 'MCQ', questions: 20, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 5, marks_per_question: 4 }
          }
        }
      },
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Each section has 25 questions: 20 MCQs + 5 Numerical',
        'Correct answer: +4 marks, Incorrect: -1 mark',
        'You can navigate freely between sections',
        'Numerical answers must be integers between 0-9999'
      ]
    }
  },

  JEE_ADVANCED: {
    jee_advanced_paper1: {
      format_id: 'jee_advanced_paper1',
      name: 'JEE Advanced Paper 1',
      duration_minutes: 180,
      total_marks: 198,
      sections: {
        physics: {
          name: 'Physics',
          marks: 66,
          subsections: {
            section_a: { type: 'MCQ', questions: 6, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 8, marks_per_question: 3 }
          }
        },
        chemistry: {
          name: 'Chemistry',
          marks: 66,
          subsections: {
            section_a: { type: 'MCQ', questions: 6, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 8, marks_per_question: 3 }
          }
        },
        mathematics: {
          name: 'Mathematics',
          marks: 66,
          subsections: {
            section_a: { type: 'MCQ', questions: 6, marks_per_question: 4 },
            section_b: { type: 'Numerical', questions: 8, marks_per_question: 3 }
          }
        }
      },
      marking_scheme: { correct: 4, incorrect: -2, unattempted: 0 },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Multiple choice and numerical type questions',
        'Correct: +4 (MCQ) or +3 (Numerical), Incorrect: -2',
        'You can navigate between sections'
      ]
    }
  },

  NEET: {
    neet_paper1: {
      format_id: 'neet_paper1',
      name: 'NEET UG',
      duration_minutes: 200,
      total_marks: 720,
      sections: {
        physics: {
          name: 'Physics',
          marks: 180,
          subsections: {
            section_a: { type: 'MCQ', questions: 45, marks_per_question: 4 }
          }
        },
        chemistry: {
          name: 'Chemistry',
          marks: 180,
          subsections: {
            section_a: { type: 'MCQ', questions: 45, marks_per_question: 4 }
          }
        },
        botany: {
          name: 'Botany',
          marks: 180,
          subsections: {
            section_a: { type: 'MCQ', questions: 45, marks_per_question: 4 }
          }
        },
        zoology: {
          name: 'Zoology',
          marks: 180,
          subsections: {
            section_a: { type: 'MCQ', questions: 45, marks_per_question: 4 }
          }
        }
      },
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      rules: [
        'Total duration: 3 hours 20 minutes (200 minutes)',
        '180 questions: Physics 45, Chemistry 45, Botany 45, Zoology 45',
        'Correct: +4 marks, Incorrect: -1 mark',
        'All questions are MCQ (single correct)'
      ]
    }
  }
};

async function main() {
  try {
    const exams = await Exam.findAll();
    if (exams.length === 0) {
      console.log('No exams in DB. Run seedThreeExams.js first.');
      if (db.pool) await db.pool.end();
      process.exit(0);
      return;
    }

    for (const exam of exams) {
      const code = (exam.code || '').toUpperCase().trim();
      const formatData = FORMATS_BY_CODE[code];
      if (!formatData) {
        console.log(`⚠️  No format defined for code "${exam.code}" — skipping`);
        continue;
      }
      await Exam.updateFormat(exam.id, formatData);
      const formatIds = Object.keys(formatData).join(', ');
      console.log(`✅ ${exam.name} (${exam.code}): format updated → ${formatIds}`);
    }

    console.log('\nDone. All matching exams have format seeded.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
