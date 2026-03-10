/**
 * Generate a JEE Main Mock Test using the Gemini API
 *
 * Format (2024 pattern):
 *   Physics:     20 MCQ  + 5 Numerical  = 25 q, 100 marks
 *   Chemistry:   20 MCQ  + 5 Numerical  = 25 q, 100 marks
 *   Mathematics: 20 MCQ  + 5 Numerical  = 25 q, 100 marks
 *   Total: 75 questions, 300 marks  (+4 / -1)
 *
 * Usage:
 *   node scripts/generateJeeMainMockWithGemini.js [--mock-number=N] [--dry-run]
 */

const {
  buildDifficultyArray,
  initGeminiAndDb,
  setupMockTest,
  generateWithBatching,
  finalizeMock,
  printSummary,
} = require('./lib/mockGenerator');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const numArg     = args.find(a => a.startsWith('--mock-number='));
const ORDER_INDEX = numArg ? parseInt(numArg.split('=')[1], 10) : 1;
const DRY_RUN    = args.includes('--dry-run');

// ─── Exam constants ───────────────────────────────────────────────────────────
const EXAM_NAME          = 'JEE Main';
const MARKS_CORRECT      = 4;
const MARKS_NEGATIVE     = 1;
const QUESTIONS_PER_REQ  = 5;
const CONCURRENCY        = 3;
const SAVE_BATCH_SIZE    = 10;
const MIN_ACCEPTABLE     = 60;

// ─── Topic + question-count config ───────────────────────────────────────────
const SUBJECTS = {
  Physics: {
    topics: [
      'Mechanics - Kinematics',
      'Mechanics - Laws of Motion',
      'Mechanics - Work, Energy and Power',
      'Mechanics - Rotational Motion',
      'Mechanics - Gravitation',
      'Mechanics - Properties of Matter',
      'Thermodynamics',
      'Waves and Sound',
      'Electrostatics',
      'Current Electricity',
      'Magnetic Effects of Current',
      'Electromagnetic Induction',
      'Optics - Ray Optics',
      'Optics - Wave Optics',
      'Modern Physics - Dual Nature',
      'Modern Physics - Atoms and Nuclei',
    ],
    mcqCount: 20,
    numericalCount: 5,
  },
  Chemistry: {
    topics: [
      'Physical Chemistry - Atomic Structure',
      'Physical Chemistry - Chemical Bonding',
      'Physical Chemistry - States of Matter',
      'Physical Chemistry - Thermodynamics',
      'Physical Chemistry - Chemical Equilibrium',
      'Physical Chemistry - Ionic Equilibrium',
      'Physical Chemistry - Redox Reactions',
      'Physical Chemistry - Electrochemistry',
      'Physical Chemistry - Chemical Kinetics',
      'Inorganic Chemistry - Periodic Table',
      'Inorganic Chemistry - p-Block Elements',
      'Inorganic Chemistry - d and f Block Elements',
      'Inorganic Chemistry - Coordination Compounds',
      'Organic Chemistry - Basic Principles',
      'Organic Chemistry - Hydrocarbons',
      'Organic Chemistry - Organic Compounds with Functional Groups',
    ],
    mcqCount: 20,
    numericalCount: 5,
  },
  Mathematics: {
    topics: [
      'Algebra - Complex Numbers',
      'Algebra - Quadratic Equations',
      'Algebra - Sequences and Series',
      'Algebra - Permutations and Combinations',
      'Algebra - Binomial Theorem',
      'Algebra - Matrices and Determinants',
      'Calculus - Limits and Continuity',
      'Calculus - Differentiation',
      'Calculus - Applications of Derivatives',
      'Calculus - Integration',
      'Calculus - Differential Equations',
      'Coordinate Geometry - Straight Lines',
      'Coordinate Geometry - Circles',
      'Coordinate Geometry - Conic Sections',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Probability',
      'Trigonometry',
    ],
    mcqCount: 20,
    numericalCount: 5,
  },
};

// ─── Build question params ────────────────────────────────────────────────────
function buildAllParams() {
  const allParams = [];

  for (const [subject, { topics, mcqCount, numericalCount }] of Object.entries(SUBJECTS)) {
    const total      = mcqCount + numericalCount;
    const difficulties = buildDifficultyArray(total);
    let di = 0;
    const sectionName = subject.toLowerCase();

    for (let i = 0; i < mcqCount; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  sectionName,
        section_type:  'MCQ',
        topic:         topics[i % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'mcq_single',
        marks:         MARKS_CORRECT,
        negative_marks: MARKS_NEGATIVE,
      });
    }
    for (let i = 0; i < numericalCount; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  sectionName,
        section_type:  'Numerical',
        topic:         topics[(mcqCount + i) % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'numerical',
        marks:         MARKS_CORRECT,
        negative_marks: MARKS_NEGATIVE,
      });
    }
  }
  return allParams;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 JEE Main Mock Generator');
  console.log('='.repeat(60));
  console.log(`   Mock number : ${ORDER_INDEX}`);
  console.log(`   Mode        : ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('='.repeat(60) + '\n');

  const allParams = buildAllParams();
  console.log('📋 Question distribution:');
  for (const [sub, { mcqCount, numericalCount, topics }] of Object.entries(SUBJECTS)) {
    console.log(`  ${sub}: ${mcqCount} MCQ + ${numericalCount} Numerical  (${topics.length} topics)`);
  }
  console.log(`\n   Total: ${allParams.length} questions\n`);

  if (DRY_RUN) {
    console.log('✅ DRY RUN complete — remove --dry-run to generate.');
    return;
  }

  await initGeminiAndDb();
  const { examId, mockTestId } = await setupMockTest(EXAM_NAME, ORDER_INDEX);

  const startMs = Date.now();
  const { successful, failed, savedCount } = await generateWithBatching(allParams, {
    examId,
    mockTestId,
    questionsPerRequest: QUESTIONS_PER_REQ,
    concurrency:         CONCURRENCY,
    saveBatchSize:       SAVE_BATCH_SIZE,
  });
  const durationMs = Date.now() - startMs;

  const ok = printSummary({
    examName:        EXAM_NAME,
    orderIndex:      ORDER_INDEX,
    savedCount,
    totalParams:     allParams.length,
    failed,
    successful,
    durationMs,
    marksPerQuestion: MARKS_CORRECT,
    subjects:         Object.keys(SUBJECTS),
    minAcceptable:   MIN_ACCEPTABLE,
  });

  if (!ok) { process.exit(1); }

  await finalizeMock({ examId, mockTestId, savedCount });
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
