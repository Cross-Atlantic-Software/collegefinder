/**
 * Delete all data from exams_taxonomies, then seed with exams in the new (nested) format.
 * New format: format JSONB with keys like "default" or "paper1"/"paper2", each with
 * name, duration_minutes, total_questions, total_marks, marking_scheme, rules, sections (with subsections).
 *
 * Run from backend: node scripts/resetAndSeedExamTaxonomies.js
 * Or from repo root: node backend/scripts/resetAndSeedExamTaxonomies.js
 */

require('dotenv').config();
const db = require('../src/config/database');

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

function buildCuetFormat() {
  return {
    default: {
      name: 'CUET (UG)',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Section I - General Test: 50 questions',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'Multiple choice - choose one correct option',
      ],
      sections: {
        'Section I - General Test': {
          name: 'Section I - General Test',
          total_questions: 50,
          marks: 200,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions: 50,
              marks_per_question: 4,
              required: 50,
            },
          },
        },
      },
    },
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
      rules: [
        'National Aptitude Test in Architecture — aptitude for B.Arch programmes per Council of Architecture norms.',
        'Assesses cognitive skills, visual perception, aesthetic sensitivity, logical reasoning, and critical thinking.',
        'Actual pattern (sessions, drawing component, marking) is defined in the official brochure each year.',
        'Official site: https://www.nata.in/',
      ],
      sections: {
        'Aptitude (representative MCQ block)': {
          name: 'Aptitude (representative MCQ block)',
          total_questions: 50,
          marks: 200,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions: 50,
              marks_per_question: 4,
              required: 50,
            },
          },
        },
      },
    },
  };
}

const EXAMS = [
  {
    name: 'JEE Main',
    code: 'JEE_MAIN',
    description: 'Joint Entrance Examination Main - for admission to NITs, IIITs, and other engineering colleges',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildJeeMainFormat(),
  },
  {
    name: 'JEE Advanced',
    code: 'JEE_ADVANCED',
    description: 'Joint Entrance Examination Advanced - for admission to IITs. Two papers: Paper 1 and Paper 2.',
    exam_type: 'National',
    conducting_authority: 'IIT',
    number_of_papers: 2,
    format: buildJeeAdvancedFormat(),
  },
  {
    name: 'NEET',
    code: 'NEET',
    description: 'National Eligibility cum Entrance Test - for admission to medical and dental colleges',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildNeetFormat(),
  },
  {
    name: 'CUET',
    code: 'CUET',
    description: 'Common University Entrance Test - for admission to central and other participating universities',
    exam_type: 'National',
    conducting_authority: 'NTA',
    number_of_papers: 1,
    format: buildCuetFormat(),
  },
  {
    name: 'NATA',
    code: 'NATA',
    description:
      'National Aptitude Test in Architecture — for admission to architecture programmes as per Council of Architecture regulations.',
    exam_type: 'National',
    conducting_authority: 'Council of Architecture (COA)',
    number_of_papers: 1,
    format: buildNataFormat(),
    website: 'https://www.nata.in/',
  },
];

async function main() {
  try {
    console.log('🗑️  Deleting all rows from exams_taxonomies (CASCADE will clear exam_mock_prompts etc.)...\n');

    await db.query('DELETE FROM exams_taxonomies');
    const seqResult = await db.query(
      "SELECT setval(pg_get_serial_sequence('exams_taxonomies', 'id'), 1, false)"
    );
    console.log('   exams_taxonomies cleared; id sequence reset.\n');

    console.log('🌱 Seeding exams_taxonomies with new (nested) format...\n');

    for (const exam of EXAMS) {
      const result = await db.query(
        `INSERT INTO exams_taxonomies (name, code, description, exam_type, conducting_authority, format, number_of_papers, website)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
         RETURNING id, name, code`,
        [
          exam.name,
          exam.code,
          exam.description,
          exam.exam_type || null,
          exam.conducting_authority || null,
          JSON.stringify(exam.format),
          exam.number_of_papers || 1,
          exam.website ?? null,
        ]
      );

      if (result.rows.length > 0) {
        const formats = Object.keys(exam.format).join(', ');
        console.log(`   ✅ ${result.rows[0].name} (${result.rows[0].code}) - ID: ${result.rows[0].id} [formats: ${formats}]`);
      }
    }

    console.log('\n📊 Current exams in database:');
    const allExams = await db.query('SELECT id, name, code FROM exams_taxonomies ORDER BY id');
    allExams.rows.forEach((row) => {
      console.log(`   ${row.id}: ${row.name} (${row.code})`);
    });

    console.log('\n✨ Done. Exam taxonomies reset and seeded with new format.');
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
