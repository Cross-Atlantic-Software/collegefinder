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
 *   node scripts/generateJeeMainMockWithGemini.js [--mock-number=N] [--dry-run] [--resume]
 *
 *   --resume  Keep existing questions and generate only the remaining ones (for partial runs)
 */

const {
  buildDifficultyArray,
  initGeminiAndDb,
  setupMockTest,
  getMockSubjectCounts,
  generateWithBatching,
  finalizeMock,
  printSummary,
} = require('./lib/mockGenerator');

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args       = process.argv.slice(2);
const numArg     = args.find(a => a.startsWith('--mock-number='));
const ORDER_INDEX = numArg ? parseInt(numArg.split('=')[1], 10) : 1;
const DRY_RUN    = args.includes('--dry-run');
const RESUME     = args.includes('--resume');

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
const QUESTIONS_PER_SUBJECT = 25; // Physics: 25, Chemistry: 25, Mathematics: 25

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

/**
 * Split params by subject. Order: Physics (0-24), Chemistry (25-49), Mathematics (50-74).
 */
function getParamsBySubject(allParams) {
  const subjects = Object.keys(SUBJECTS);
  const bySubject = {};
  let offset = 0;
  for (const sub of subjects) {
    bySubject[sub] = allParams.slice(offset, offset + QUESTIONS_PER_SUBJECT);
    offset += QUESTIONS_PER_SUBJECT;
  }
  return bySubject;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 JEE Main Mock Generator');
  console.log('='.repeat(60));
  console.log(`   Mock number : ${ORDER_INDEX}`);
  console.log(`   Mode        : ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}${RESUME ? ' (RESUME)' : ''}`);
  console.log('='.repeat(60) + '\n');

  const allParams = buildAllParams();
  const paramsBySubject = getParamsBySubject(allParams);

  console.log('📋 Question distribution (25 per subject):');
  for (const [sub, { mcqCount, numericalCount, topics }] of Object.entries(SUBJECTS)) {
    console.log(`  ${sub}: ${mcqCount} MCQ + ${numericalCount} Numerical  (${topics.length} topics)`);
  }
  console.log(`\n   Total: ${allParams.length} questions\n`);

  if (DRY_RUN) {
    console.log('✅ DRY RUN complete — remove --dry-run to generate.');
    return;
  }

  await initGeminiAndDb();
  const { examId, mockTestId, existingCount } = await setupMockTest(EXAM_NAME, ORDER_INDEX, { resume: RESUME });

  const subjectOrder = Object.keys(SUBJECTS);
  let allSuccessful = [];
  let allFailed = [];
  let totalSavedCount = existingCount;
  const startMs = Date.now();

  if (RESUME && existingCount > 0) {
    const subjectCounts = await getMockSubjectCounts(mockTestId);
    console.log('📊 Existing per subject:', subjectCounts, '\n');

    for (let i = 0; i < subjectOrder.length; i++) {
      const subject = subjectOrder[i];
      const existing = subjectCounts[subject] || 0;
      const need = QUESTIONS_PER_SUBJECT - existing;

      if (need <= 0) {
        console.log(`⏭️  ${subject}: ${existing}/25 (complete)\n`);
        continue;
      }

      const subjectParams = paramsBySubject[subject];
      const paramsToGenerate = subjectParams.slice(existing, QUESTIONS_PER_SUBJECT);
      const startOrderIndex = 1 + i * QUESTIONS_PER_SUBJECT + existing;

      console.log(`\n📗 ${subject}: generating ${need} more (slots ${startOrderIndex}–${startOrderIndex + need - 1})\n`);

      const { successful, failed, savedCount } = await generateWithBatching(paramsToGenerate, {
        examId,
        mockTestId,
        existingCount: 0,
        questionsPerRequest: QUESTIONS_PER_REQ,
        concurrency:         CONCURRENCY,
        saveBatchSize:       SAVE_BATCH_SIZE,
        startOrderIndex,
      });

      allSuccessful = allSuccessful.concat(successful);
      allFailed = allFailed.concat(failed);
      totalSavedCount += savedCount;
    }
  } else {
    for (let i = 0; i < subjectOrder.length; i++) {
      const subject = subjectOrder[i];
      const subjectParams = paramsBySubject[subject];
      const startOrderIndex = 1 + i * QUESTIONS_PER_SUBJECT;

      console.log(`\n📗 ${subject}: generating 25 questions (slots ${startOrderIndex}–${startOrderIndex + 24})\n`);

      const { successful, failed, savedCount } = await generateWithBatching(subjectParams, {
        examId,
        mockTestId,
        existingCount: 0,
        questionsPerRequest: QUESTIONS_PER_REQ,
        concurrency:         CONCURRENCY,
        saveBatchSize:       SAVE_BATCH_SIZE,
        startOrderIndex,
      });

      allSuccessful = allSuccessful.concat(successful);
      allFailed = allFailed.concat(failed);
      totalSavedCount += savedCount;
    }
  }

  const durationMs = Date.now() - startMs;

  const ok = printSummary({
    examName:        EXAM_NAME,
    orderIndex:      ORDER_INDEX,
    savedCount:      totalSavedCount,
    totalParams:     allParams.length,
    failed:          allFailed,
    successful:      allSuccessful,
    durationMs,
    marksPerQuestion: MARKS_CORRECT,
    subjects:         subjectOrder,
    minAcceptable:   MIN_ACCEPTABLE,
  });

  if (!ok) { process.exit(1); }

  await finalizeMock({ examId, mockTestId, savedCount: totalSavedCount });
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
