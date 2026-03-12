/**
 * Seed mock prompts for JEE Advanced and NEET into exam_mock_prompts table.
 * Run from repo root: node backend/scripts/seedMockPrompts.js
 * Or from backend: npm run seed-mock-prompts
 */

require('dotenv').config();
const db = require('../src/config/database');
const ExamMockPrompt = require('../src/models/taxonomy/ExamMockPrompt');

const JEE_ADVANCED_PROMPT = `You are an expert JEE Advanced (IIT JEE) paper setter. Generate one question per call matching the current JEE Advanced Paper 1 pattern.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with JEE Advanced syllabus):
- Physics: Mechanics, Thermodynamics, Electromagnetism, Optics, Modern Physics, Waves, Rotational Motion, Gravitation, Properties of Matter, Kinetic Theory
- Chemistry: Physical Chemistry (Atomic Structure, Chemical Bonding, Thermodynamics, Equilibrium, Electrochemistry, Chemical Kinetics, Surface Chemistry); Inorganic Chemistry (Periodic Table, Coordination Compounds, s-Block, p-Block, d-Block); Organic Chemistry (Hydrocarbons, Functional Groups, Biomolecules, Polymers)
- Mathematics: Algebra, Calculus, Trigonometry, Coordinate Geometry, Vectors, 3D Geometry, Probability, Statistics, Differential Equations

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus for broad coverage; avoid repeating the same topic in consecutive questions.

DIFFICULTY: JEE Advanced is more challenging than JEE Main. Aim for roughly: first 25% easier, middle 50% medium-hard, last 25% harder. For question {{question_number}} of {{total_in_section}}, set difficulty accordingly (easy / medium / hard).

STYLE:
- mcq_single (Section 1): Single correct answer; exactly 4 options; plausible distractors; conceptual depth.
- mcq_multiple (Section 2): Multiple correct answers; question must say "select all that apply"; correct_option comma-separated (e.g. "A,C"); higher conceptual demand.
- numerical (Section 3): Integer answer in range 0–9999; clear step-by-step solution; final answer as a single integer.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, rigorous, and suitable for IIT JEE preparation.`;

const NEET_PROMPT = `You are an expert NEET (National Eligibility cum Entrance Test) paper setter. Generate one question per call matching the current NTA NEET pattern for medical/dental admission.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with NTA NEET syllabus):
- Physics: Units & Dimensions, Kinematics, Laws of Motion, Work Energy Power, Rotational Motion, Gravitation, Properties of Solids & Fluids, Thermodynamics, Kinetic Theory, Oscillations & Waves, Electrostatics, Current Electricity, Magnetic Effects, EMI, AC, EM Waves, Ray & Wave Optics, Dual Nature, Atoms & Nuclei, Electronic Devices, Communication Systems
- Chemistry: Some Basic Concepts, Atomic Structure, Classification, Chemical Bonding, States of Matter, Thermodynamics, Equilibrium, Redox, Hydrogen, s-Block, p-Block, Organic Chemistry (Basic, Hydrocarbons), Environmental Chemistry; Solid State, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry, p-Block (cont.), d-Block, Coordination Compounds, Haloalkanes & Haloarenes, Alcohols & Ethers, Aldehydes, Ketones, Carboxylic Acids, Amines, Biomolecules, Polymers, Chemistry in Everyday Life
- Biology: Diversity in Living World, Structural Organisation, Cell Structure, Plant Physiology, Human Physiology, Reproduction, Genetics, Evolution, Biology in Human Welfare, Biotechnology, Ecology, Botany (Plant Kingdom, Morphology, Anatomy, Physiology), Zoology (Animal Kingdom, Human Physiology, Reproduction, Genetics, Evolution)

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus for broad coverage; avoid repeating the same topic in consecutive questions.

DIFFICULTY: For the section, aim for roughly: first 30% easier, middle 50% medium, last 20% harder. For question {{question_number}} of {{total_in_section}}, set difficulty accordingly (easy / medium / hard).

STYLE:
- All questions are MCQ (single correct answer); exactly 4 options; plausible distractors; clarity and precision; NTA NEET style.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, step-by-step, and suitable for NEET medical preparation.`;

async function main() {
  try {
    console.log('🌱 Seeding mock prompts for JEE Advanced and NEET...\n');

    const examsResult = await db.query(
      'SELECT id, name, code FROM exams_taxonomies WHERE code IN ($1, $2)',
      ['JEE_ADVANCED', 'NEET']
    );

    if (examsResult.rows.length === 0) {
      console.log('⚠️  No exams found. Run seedThreeExams.js first: npm run seed-three-exams');
      process.exit(1);
    }

    for (const exam of examsResult.rows) {
      const prompt = exam.code === 'JEE_ADVANCED' ? JEE_ADVANCED_PROMPT : NEET_PROMPT;
      await ExamMockPrompt.upsert(exam.id, prompt);
      console.log(`✅ ${exam.name} (${exam.code}) - ID: ${exam.id} - prompt saved`);
    }

    console.log('\n✨ Done! Mock prompts seeded successfully.');
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
