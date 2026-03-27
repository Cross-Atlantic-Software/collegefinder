/**
 * Generate a NEET Mock Test using the Gemini API
 *
 * Format (NEET 2024 pattern):
 *   Physics:   Section A 35 MCQ + Section B 15 MCQ (attempt any 10)  = 50 q
 *   Chemistry: Section A 35 MCQ + Section B 15 MCQ (attempt any 10)  = 50 q
 *   Botany:    Section A 35 MCQ + Section B 15 MCQ (attempt any 10)  = 50 q
 *   Zoology:   Section A 35 MCQ + Section B 15 MCQ (attempt any 10)  = 50 q
 *   Total seed: 200 questions (+4 / -1)
 *
 * Usage:
 *   node scripts/generateNeetMockWithGemini.js [--mock-number=N] [--dry-run]
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
const EXAM_NAME         = 'NEET';
const MARKS_CORRECT     = 4;
const MARKS_NEGATIVE    = 1;
const QUESTIONS_PER_REQ = 5;
const CONCURRENCY       = 3;
const SAVE_BATCH_SIZE   = 10;
const MIN_ACCEPTABLE    = 150; // out of 200

// ─── NEET topic config ────────────────────────────────────────────────────────
// Each subject: Section A (35 required MCQ) + Section B (15 MCQ, attempt 10)
const SUBJECTS = {
  Physics: {
    sectionA: 35,
    sectionB: 15,
    topics: [
      'Physical World and Measurement',
      'Kinematics',
      'Laws of Motion',
      'Work, Energy and Power',
      'Motion of System of Particles and Rigid Body',
      'Gravitation',
      'Properties of Bulk Matter',
      'Thermodynamics',
      'Behaviour of Perfect Gas and Kinetic Theory',
      'Oscillations and Waves',
      'Electrostatics',
      'Current Electricity',
      'Magnetic Effects of Current and Magnetism',
      'Electromagnetic Induction and Alternating Currents',
      'Electromagnetic Waves',
      'Optics - Ray Optics',
      'Optics - Wave Optics',
      'Dual Nature of Radiation and Matter',
      'Atoms and Nuclei',
      'Electronic Devices',
    ],
  },
  Chemistry: {
    sectionA: 35,
    sectionB: 15,
    topics: [
      'Some Basic Concepts of Chemistry',
      'Structure of Atom',
      'Classification of Elements and Periodicity',
      'Chemical Bonding and Molecular Structure',
      'States of Matter - Gases and Liquids',
      'Thermodynamics',
      'Equilibrium',
      'Redox Reactions',
      'Hydrogen',
      's-Block Elements',
      'p-Block Elements - Group 13 and 14',
      'Organic Chemistry - Basic Principles and Techniques',
      'Hydrocarbons',
      'Environmental Chemistry',
      'Solid State',
      'Solutions',
      'Electrochemistry',
      'Chemical Kinetics',
      'Surface Chemistry',
      'p-Block Elements - Group 15 to 18',
      'd and f Block Elements',
      'Coordination Compounds',
      'Haloalkanes and Haloarenes',
      'Alcohols, Phenols and Ethers',
      'Aldehydes, Ketones and Carboxylic Acids',
      'Amines',
      'Biomolecules',
      'Polymers',
      'Chemistry in Everyday Life',
    ],
  },
  Botany: {
    sectionA: 35,
    sectionB: 15,
    topics: [
      'The Living World',
      'Biological Classification',
      'Plant Kingdom',
      'Morphology of Flowering Plants',
      'Anatomy of Flowering Plants',
      'Cell: The Unit of Life',
      'Cell Cycle and Cell Division',
      'Transport in Plants',
      'Mineral Nutrition',
      'Photosynthesis in Higher Plants',
      'Respiration in Plants',
      'Plant Growth and Development',
      'Reproduction in Organisms',
      'Sexual Reproduction in Flowering Plants',
      'Principles of Inheritance and Variation',
      'Molecular Basis of Inheritance',
      'Evolution',
      'Organisms and Populations',
      'Ecosystem',
      'Biodiversity and Conservation',
    ],
  },
  Zoology: {
    sectionA: 35,
    sectionB: 15,
    topics: [
      'Animal Kingdom',
      'Structural Organisation in Animals',
      'Biomolecules',
      'Digestion and Absorption',
      'Breathing and Exchange of Gases',
      'Body Fluids and Circulation',
      'Excretory Products and their Elimination',
      'Locomotion and Movement',
      'Neural Control and Coordination',
      'Chemical Coordination and Integration',
      'Human Reproduction',
      'Reproductive Health',
      'Human Health and Disease',
      'Microbes in Human Welfare',
      'Biotechnology - Principles and Processes',
      'Biotechnology and its Applications',
      'Environmental Issues',
    ],
  },
};

// ─── Build question params ────────────────────────────────────────────────────
function buildAllParams() {
  const allParams = [];

  for (const [subject, { sectionA, sectionB, topics }] of Object.entries(SUBJECTS)) {
    const total       = sectionA + sectionB;
    const difficulties = buildDifficultyArray(total);
    let di = 0;
    const subjectLower = subject.toLowerCase();

    // Section A — required questions
    for (let i = 0; i < sectionA; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  subjectLower,
        section_type:  'MCQ',
        section_label: 'Section A',
        topic:         topics[i % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'mcq_single',
        marks:         MARKS_CORRECT,
        negative_marks: MARKS_NEGATIVE,
      });
    }

    // Section B — optional (attempt any 10 of 15)
    for (let i = 0; i < sectionB; i++) {
      allParams.push({
        exam_name:     EXAM_NAME,
        subject,
        section_name:  subjectLower,
        section_type:  'MCQ',
        section_label: 'Section B',
        topic:         topics[(sectionA + i) % topics.length],
        difficulty:    difficulties[di++],
        question_type: 'mcq_single',
        marks:         MARKS_CORRECT,
        negative_marks: MARKS_NEGATIVE,
      });
    }
  }

  return allParams;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🚀 NEET Mock Generator');
  console.log('='.repeat(60));
  console.log(`   Mock number : ${ORDER_INDEX}`);
  console.log(`   Mode        : ${DRY_RUN ? 'DRY RUN' : 'PRODUCTION'}`);
  console.log('='.repeat(60) + '\n');

  const allParams = buildAllParams();
  console.log('📋 Question distribution:');
  for (const [sub, { sectionA, sectionB, topics }] of Object.entries(SUBJECTS)) {
    console.log(`  ${sub.padEnd(10)}: ${sectionA} Sec-A + ${sectionB} Sec-B  (${topics.length} topics)`);
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
    examName:         EXAM_NAME,
    orderIndex:       ORDER_INDEX,
    savedCount,
    totalParams:      allParams.length,
    failed,
    successful,
    durationMs,
    marksPerQuestion: MARKS_CORRECT,
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
