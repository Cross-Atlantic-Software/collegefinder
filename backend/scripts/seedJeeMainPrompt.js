/**
 * Seed the JEE Main mock generation prompt into exam_mock_prompts.
 *
 * Run from repo root: node backend/scripts/seedJeeMainPrompt.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const JEE_MAIN_PROMPT = `You are an expert JEE Main (NTA) paper setter. Generate one question per call matching the current NTA JEE Main Paper 1 (B.E./B.Tech) pattern.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with NTA JEE Main 2025 syllabus):
- Physics: Units & Dimensions, Kinematics, Laws of Motion, Work Energy Power, Rotational Motion, Gravitation, Properties of Solids & Fluids, Thermodynamics, Kinetic Theory, Oscillations & Waves, Electrostatics, Current Electricity, Magnetic Effects, EMI, AC, EM Waves, Ray & Wave Optics, Dual Nature, Atoms & Nuclei, Electronic Devices, Communication Systems
- Chemistry: Some Basic Concepts, Atomic Structure, Classification, Chemical Bonding, States of Matter, Thermodynamics, Equilibrium, Redox, Hydrogen, s-Block, p-Block, Organic Chemistry (Basic, Hydrocarbons), Environmental Chemistry; Solid State, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry, p-Block (cont.), d-Block, Coordination Compounds, Haloalkanes & Haloarenes, Alcohols & Ethers, Aldehydes, Ketones, Carboxylic Acids, Amines, Biomolecules, Polymers, Chemistry in Everyday Life
- Mathematics: Sets, Relations & Functions, Complex Numbers, Quadratic Equations, Matrices, Permutations & Combinations, Binomial Theorem, Sequences & Series, Straight Lines, Conic Sections, 3D Geometry, Limits, Continuity, Differentiation, Applications of Derivatives, Integrals, Applications of Integrals, Differential Equations, Vector Algebra, Probability, Statistics

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus so that across the section there is broad coverage; avoid repeating the same topic in consecutive questions.

DIFFICULTY: For the section, aim for roughly: first 30% easier, middle 50% medium, last 20% harder. For question {{question_number}} of {{total_in_section}}, set difficulty accordingly (easy / medium / hard).

STYLE:
- MCQ (Section A): Single correct answer; exactly 4 options; plausible distractors; clarity and precision; NTA JEE Main 2025–2026 style.
- Numerical (Section B): Integer answer in range 0–9999; clear step-by-step solution; final answer as a single integer.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, step-by-step, and suitable for JEE Main preparation.`;

async function main() {
  try {
    const examRes = await db.query(
      "SELECT id, name, code FROM exams_taxonomies WHERE code = 'JEE_MAIN'"
    );
    if (examRes.rows.length === 0) {
      console.error('❌ JEE Main exam not found. Run seedThreeExams.js first.');
      process.exit(1);
    }
    const exam = examRes.rows[0];

    await db.query(
      `INSERT INTO exam_mock_prompts (exam_id, prompt, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (exam_id) DO UPDATE SET
         prompt = EXCLUDED.prompt,
         updated_at = CURRENT_TIMESTAMP`,
      [exam.id, JEE_MAIN_PROMPT]
    );

    console.log(`✅ Saved JEE Main prompt for ${exam.name} (ID: ${exam.id})`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
