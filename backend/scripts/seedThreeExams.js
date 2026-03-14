/**
 * Seed 3 exams into exams_taxonomies: JEE Main, JEE Advanced, CUET.
 * Each exam has proper format configuration. JEE Advanced has 2 papers (Paper 1 and Paper 2).
 *
 * Run from repo root: node backend/scripts/seedThreeExams.js
 */

require('dotenv').config();
const db = require('../src/config/database');

/**
 * Build a single-paper format config (nested structure).
 */
function buildSinglePaperFormat(config) {
  const durationMinutes = config.duration_minutes ?? 180;
  const markingScheme = config.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 };
  const marksPerQuestion = markingScheme.correct ?? 4;
  const sections = config.sections || {};
  const sectionsWithMeta = {};

  for (const [key, sectionConfig] of Object.entries(sections)) {
    const subsections = sectionConfig.subsections || {};
    const subsectionsWithMeta = {};
    let sectionMarks = 0;

    for (const [subKey, subConfig] of Object.entries(subsections)) {
      const count = subConfig.count ?? subConfig.questions ?? 0;
      subsectionsWithMeta[subKey] = {
        ...subConfig,
        type: subConfig.type || 'mcq_single',
        questions: subConfig.questions ?? count,
        marks_per_question: subConfig.marks_per_question ?? marksPerQuestion,
      };
      sectionMarks += (subConfig.questions ?? count) * (subConfig.marks_per_question ?? marksPerQuestion);
    }

    sectionsWithMeta[key] = {
      ...sectionConfig,
      name: sectionConfig.name || key,
      marks: sectionConfig.marks ?? sectionMarks,
      subsections: subsectionsWithMeta,
    };
  }

  return {
    name: config.name,
    duration_minutes: durationMinutes,
    total_questions: config.total_questions,
    total_marks: config.total_marks,
    marking_scheme: markingScheme,
    rules: config.rules || [],
    sections: sectionsWithMeta,
  };
}

/**
 * Build JEE Main format (single paper, 90 questions).
 */
function buildJeeMainFormat() {
  const config = {
    name: 'JEE Main 2024',
    duration_minutes: 180,
    total_questions: 90,
    total_marks: 300,
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
    rules: [
      'Total duration: 3 hours (180 minutes)',
      'Total questions: 90 (75 MCQs + 15 Numerical)',
      'Maximum marks: 300',
      'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
      'Section A (MCQ): Choose one correct option',
      'Section B (Numerical): Answer must be a number between 0-9999',
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
  };
  return { default: buildSinglePaperFormat(config) };
}

/**
 * Build JEE Advanced format (2 papers: Paper 1 and Paper 2).
 */
function buildJeeAdvancedFormat() {
  const paperConfig = {
    duration_minutes: 180,
    total_questions: 54,
    total_marks: 264,
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
    rules: [
      'Total duration: 3 hours per paper',
      'Total questions: 54 per paper',
      'Maximum marks: 264 per paper',
      'Marking varies by question type',
      'Negative marking applicable',
      'Partial marking in some questions',
    ],
    sections: {
      Physics: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
      Chemistry: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
      Mathematics: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
    },
  };

  return {
    paper1: buildSinglePaperFormat({ ...paperConfig, name: 'JEE Advanced Paper 1' }),
    paper2: buildSinglePaperFormat({ ...paperConfig, name: 'JEE Advanced Paper 2' }),
  };
}

/**
 * Build NEET format (single paper, 200 questions).
 */
function buildNeetFormat() {
  const config = {
    name: 'NEET 2024',
    duration_minutes: 180,
    total_questions: 200,
    total_marks: 720,
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
    rules: [
      'Total duration: 3 hours (180 minutes)',
      'Total questions: 200 (180 to be attempted)',
      'Maximum marks: 720',
      'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
      'All questions are multiple choice with single correct answer',
      'Pen and paper based exam',
    ],
    sections: {
      Physics: {
        total_questions: 50,
        subsections: {
          'Section A': { type: 'mcq_single', count: 35, required: 35 },
          'Section B': { type: 'mcq_single', count: 15, required: 10 },
        },
      },
      Chemistry: {
        total_questions: 50,
        subsections: {
          'Section A': { type: 'mcq_single', count: 35, required: 35 },
          'Section B': { type: 'mcq_single', count: 15, required: 10 },
        },
      },
      Biology: {
        total_questions: 100,
        subsections: {
          'Botany - Section A': { type: 'mcq_single', count: 35, required: 35 },
          'Botany - Section B': { type: 'mcq_single', count: 15, required: 10 },
          'Zoology - Section A': { type: 'mcq_single', count: 35, required: 35 },
          'Zoology - Section B': { type: 'mcq_single', count: 15, required: 10 },
        },
      },
    },
  };
  return { default: buildSinglePaperFormat(config) };
}

/**
 * Build CUET (UG) format - Common University Entrance Test.
 */
function buildCuetFormat() {
  const config = {
    name: 'CUET UG',
    duration_minutes: 180,
    total_questions: 50,
    total_marks: 200,
    marking_scheme: { correct: 5, incorrect: -1, unattempted: 0 },
    rules: [
      'Common University Entrance Test (UG) - for central and participating universities',
      'Multiple domain-specific papers; generic single-paper format here.',
    ],
    sections: {
      'Domain / General': {
        total_questions: 50,
        subsections: {
          'Section A': { type: 'mcq_single', count: 50, required: 40 },
        },
      },
    },
  };
  return { default: buildSinglePaperFormat(config) };
}

const EXAMS = [
  {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    description: 'Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges',
    format: buildJeeMainFormat(),
  },
  {
    name: 'JEE Advanced',
    code: 'JEE_ADVANCED',
    description: 'Joint Entrance Examination Advanced - for admission to IITs. Two papers: Paper 1 and Paper 2.',
    format: buildJeeAdvancedFormat(),
  },
  {
    name: 'CUET',
    code: 'CUET',
    description: 'Common University Entrance Test (UG) - for central and participating universities',
    format: buildCuetFormat(),
  },
];

async function main() {
  try {
    console.log('🌱 Seeding exams_taxonomies with JEE Main, JEE Advanced, CUET...\n');

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
        const formats = Object.keys(exam.format).join(', ');
        console.log(`✅ ${result.rows[0].name} (${result.rows[0].code}) - ID: ${result.rows[0].id} [formats: ${formats}]`);
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
