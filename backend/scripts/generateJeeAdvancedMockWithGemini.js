/**
 * Generate a JEE Advanced Mock Test using the Gemini API
 *
 * Format (JEE Advanced 2024 pattern — Paper 1 + Paper 2 combined):
 *
 *   Each subject (Physics / Chemistry / Mathematics):
 *     Section 1 — Single Correct MCQ     :  6 q  (+3 / -1)
 *     Section 2 — Multiple Correct MCQ   :  6 q  (+4 partial / -2 full wrong)
 *     Section 3 — Numerical (Integer)    :  6 q  (+4 / 0)
 *     = 18 questions per subject
 *
 *   Total: 54 questions
 *
 * Usage:
 *   node scripts/generateJeeAdvancedMockWithGemini.js [--mock-number=N] [--dry-run]
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
const args        = process.argv.slice(2);
const numArg      = args.find(a => a.startsWith('--mock-number='));
const ORDER_INDEX  = numArg ? parseInt(numArg.split('=')[1], 10) : 1;
const DRY_RUN     = args.includes('--dry-run');

// ─── Exam constants ───────────────────────────────────────────────────────────
const EXAM_NAME         = 'JEE Advanced';
const QUESTIONS_PER_REQ = 3;   // Advanced questions are harder; smaller batches = better quality
const CONCURRENCY       = 3;
const SAVE_BATCH_SIZE   = 9;
const MIN_ACCEPTABLE    = 45;  // out of 54

// Section-specific marking schemes
const MARKING = {
  single:    { marks: 3, negative_marks: 1 },
  multiple:  { marks: 4, negative_marks: 2 },  // partial credit awarded by exam; negative only if all wrong
  numerical: { marks: 4, negative_marks: 0 },
};

// ─── Topic config ─────────────────────────────────────────────────────────────
const SUBJECTS = {
  Physics: {
    topics: [
      'Mechanics - Kinematics and Dynamics',
      'Mechanics - Laws of Motion and Friction',
      'Mechanics - Work, Energy and Power',
      'Mechanics - Rotational Dynamics',
      'Mechanics - Gravitation',
      'Mechanics - Fluid Mechanics and Surface Tension',
      'Thermodynamics and Thermal Physics',
      'Waves - Sound and Standing Waves',
      'Electrostatics and Capacitance',
      'Current Electricity',
      'Magnetic Effects of Current',
      'Electromagnetic Induction and AC Circuits',
      'Optics - Geometrical Optics',
      'Optics - Wave Optics and Interference',
      'Modern Physics - Photoelectric Effect',
      'Modern Physics - Nuclear Physics and Radioactivity',
      'Semiconductor Devices',
    ],
    singleCount:   6,
    multipleCount: 6,
    numericalCount: 6,
  },
  Chemistry: {
    topics: [
      'Atomic Structure and Periodicity',
      'Chemical Bonding and Molecular Structure',
      'States of Matter - Gaseous and Liquid',
      'Chemical Thermodynamics',
      'Chemical Equilibrium and Ionic Equilibrium',
      'Electrochemistry',
      'Chemical Kinetics',
      'Surface Chemistry and Colloids',
      'Coordination Chemistry',
      'Metallurgy and Extraction of Metals',
      'p-Block Elements (Group 13-18)',
      'd and f Block Elements',
      'Organic Chemistry - Reaction Mechanisms',
      'Organic Chemistry - Hydrocarbons',
      'Organic Chemistry - Functional Groups',
      'Organic Chemistry - Biomolecules and Polymers',
      'Analytical and Practical Chemistry',
    ],
    singleCount:   6,
    multipleCount: 6,
    numericalCount: 6,
  },
  Mathematics: {
    topics: [
      'Algebra - Complex Numbers and Polynomials',
      'Algebra - Quadratic Equations',
      'Algebra - Matrices and Determinants',
      'Algebra - Permutations, Combinations and Probability',
      'Algebra - Mathematical Induction and Binomial Theorem',
      'Calculus - Limits, Continuity and Differentiability',
      'Calculus - Applications of Derivatives',
      'Calculus - Indefinite and Definite Integration',
      'Calculus - Differential Equations',
      'Coordinate Geometry - Straight Lines and Circles',
      'Coordinate Geometry - Parabola, Ellipse and Hyperbola',
      'Vector Algebra',
      'Three Dimensional Geometry',
      'Trigonometry and Inverse Trigonometry',
      'Mathematical Reasoning',
    ],
    singleCount:   6,
    multipleCount: 6,
    numericalCount: 6,
  },
};

// ─── Build question params ────────────────────────────────────────────────────
function buildAllParams() {
  const allParams = [];

  for (const [subject, { topics, singleCount, multipleCount, numericalCount }] of Object.entries(SUBJECTS)) {
    const total        = singleCount + multipleCount + numericalCount;
    const difficulties = buildDifficultyArray(total, { easy: 0.15, medium: 0.50, hard: 0.35 });
    let di = 0;
    const subjectLower = subject.toLowerCase();

    // Section 1 — Single Correct MCQ
    for (let i = 0; i < singleCount; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  subjectLower,
        section_type:  'MCQ',
        section_label: 'Section 1 - Single Correct',
        topic:         topics[i % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'mcq_single',
        ...MARKING.single,
      });
    }

    // Section 2 — Multiple Correct MCQ
    for (let i = 0; i < multipleCount; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  subjectLower,
        section_type:  'MCQ Multiple Correct',
        section_label: 'Section 2 - Multiple Correct',
        topic:         topics[(singleCount + i) % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'mcq_multiple',
        ...MARKING.multiple,
      });
    }

    // Section 3 — Numerical (Integer Type)
    for (let i = 0; i < numericalCount; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  subjectLower,
        section_type:  'Numerical',
        section_label: 'Section 3 - Numerical',
        topic:         topics[(singleCount + multipleCount + i) % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'numerical',
        ...MARKING.numerical,
      });
    }
  }

  return allParams;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 JEE Advanced Mock Generator');
  console.log('='.repeat(60));
  console.log(`   Mock number : ${ORDER_INDEX}`);
  console.log(`   Mode        : ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('='.repeat(60) + '\n');

  const allParams = buildAllParams();
  console.log('📋 Question distribution per subject:');
  for (const [sub, { singleCount, multipleCount, numericalCount, topics }] of Object.entries(SUBJECTS)) {
    console.log(
      `  ${sub.padEnd(12)}: ${singleCount} Single  +  ${multipleCount} Multi-correct  +  ${numericalCount} Numerical  (${topics.length} topics)`
    );
  }
  console.log('\n   Marking:');
  console.log('     Section 1 (Single)    : +3 / -1');
  console.log('     Section 2 (Multiple)  : +4 partial / -2 (all wrong)');
  console.log('     Section 3 (Numerical) : +4 / 0');
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

  // Blended average marks for the summary (actual marks vary by section)
  const avgMarks = parseFloat(
    (allParams.reduce((s, p) => s + p.marks, 0) / allParams.length).toFixed(2)
  );

  const ok = printSummary({
    examName:         EXAM_NAME,
    orderIndex:       ORDER_INDEX,
    savedCount,
    totalParams:      allParams.length,
    failed,
    successful,
    durationMs,
    marksPerQuestion: avgMarks,
    subjects:         Object.keys(SUBJECTS),
    minAcceptable:    MIN_ACCEPTABLE,
  });

  if (!ok) { process.exit(1); }

  await finalizeMock({ examId, mockTestId, savedCount });
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
