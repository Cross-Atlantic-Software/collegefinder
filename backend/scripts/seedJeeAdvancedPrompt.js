/**
 * Seed the JEE Advanced mock generation prompt into exam_mock_prompts.
 *
 * Run from repo root: node backend/scripts/seedJeeAdvancedPrompt.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const JEE_ADVANCED_PROMPT = `You are an expert JEE Advanced (IIT JEE) paper setter. Generate one question per call matching the current JEE Advanced Paper 1 / Paper 2 pattern (B.E./B.Tech).

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with JEE Advanced 2025 syllabus):
- Physics: Mechanics (Kinematics, Laws of Motion, Work Energy Power, Rotational Dynamics, Gravitation, Fluids), Thermodynamics, Waves, Electrostatics, Current Electricity, Magnetic Effects, EMI, AC, EM Waves, Ray & Wave Optics, Modern Physics (Dual Nature, Atoms & Nuclei), Semiconductor Devices
- Chemistry: Atomic Structure, Chemical Bonding, States of Matter, Thermodynamics, Equilibrium, Electrochemistry, Chemical Kinetics, Surface Chemistry, Coordination Chemistry, Metallurgy, p-Block, d/f-Block, Organic (Mechanisms, Hydrocarbons, Functional Groups, Biomolecules, Polymers), Analytical Chemistry
- Mathematics: Algebra (Complex Numbers, Quadratics, Matrices, Permutations, Binomial, Induction), Calculus (Limits, Continuity, Derivatives, Integration, Differential Equations), Coordinate Geometry (Lines, Circles, Conics), Vector Algebra, 3D Geometry, Trigonometry, Mathematical Reasoning

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus for broad coverage across the section; avoid repeating the same topic in consecutive questions.

DIFFICULTY: JEE Advanced level is inherently challenging. For question {{question_number}} of {{total_in_section}}, set difficulty (easy / medium / hard) with a bias toward medium–hard; first 20% can be easier, rest medium to hard.

STYLE:
- MCQ Single (Section 1): Single correct answer; exactly 4 options; plausible distractors; +3 correct / -1 incorrect; clarity and precision; IIT JEE Advanced style.
- MCQ Multiple (Section 2): One or more correct options; partial credit (+4 if all correct, proportional if some correct); -2 if wrong; clear instruction on "select all that apply".
- Numerical (Section 3): Non-negative integer answer (0–9999); clear step-by-step solution; final answer as a single integer; +4 correct / 0 incorrect.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, rigorous, and suitable for JEE Advanced preparation.`;

async function main() {
  try {
    const examRes = await db.query(
      "SELECT id, name, code FROM exams_taxonomies WHERE code = 'JEE_ADVANCED'"
    );
    if (examRes.rows.length === 0) {
      console.error('❌ JEE Advanced exam not found. Run seedThreeExams.js first.');
      process.exit(1);
    }
    const exam = examRes.rows[0];

    await db.query(
      `INSERT INTO exam_mock_prompts (exam_id, prompt, updated_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       ON CONFLICT (exam_id) DO UPDATE SET
         prompt = EXCLUDED.prompt,
         updated_at = CURRENT_TIMESTAMP`,
      [exam.id, JEE_ADVANCED_PROMPT]
    );

    console.log(`✅ Saved JEE Advanced prompt for ${exam.name} (ID: ${exam.id})`);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
