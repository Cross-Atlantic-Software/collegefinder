/**
 * Seed mock generation prompts for JEE Main, JEE Advanced, NEET, and CUET into exam_mock_prompts.
 * Run from repo root: node backend/scripts/seedAllExamPrompts.js
 */

require('dotenv').config();
const db = require('../src/config/database');

const PROMPTS = {
  JEE_MAIN: `You are an expert JEE Main (NTA) paper setter. Generate one question per call matching the current NTA JEE Main Paper 1 (B.E./B.Tech) pattern.

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
- Solution must be complete, step-by-step, and suitable for JEE Main preparation.`,

  JEE_ADVANCED: `You are an expert JEE Advanced (IIT JEE) paper setter. Generate one question per call matching the current JEE Advanced Paper 1 / Paper 2 pattern (B.E./B.Tech).

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
- Solution must be complete, rigorous, and suitable for JEE Advanced preparation.`,

  NEET: `You are an expert NEET (National Eligibility cum Entrance Test) paper setter. Generate one question per call matching the current NTA NEET (UG) pattern for medical/dental admissions.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}} (align with NTA NEET 2025 syllabus):
- Physics: Units & Measurements, Kinematics, Laws of Motion, Work Energy Power, Rotational Motion, Gravitation, Properties of Solids & Fluids, Thermodynamics, Kinetic Theory, Oscillations & Waves, Electrostatics, Current Electricity, Magnetic Effects, EMI, AC, EM Waves, Ray & Wave Optics, Dual Nature, Atoms & Nuclei, Electronic Devices, Communication Systems
- Chemistry: Some Basic Concepts, Atomic Structure, Classification, Chemical Bonding, States of Matter, Thermodynamics, Equilibrium, Redox, Hydrogen, s-Block, p-Block, Organic (Basic, Hydrocarbons), Environmental; Solid State, Solutions, Electrochemistry, Chemical Kinetics, Surface Chemistry, p-Block (cont.), d-Block, Coordination Compounds, Haloalkanes & Haloarenes, Alcohols & Ethers, Aldehydes, Ketones, Carboxylic Acids, Amines, Biomolecules, Polymers, Chemistry in Everyday Life
- Biology: Diversity in Living World, Structural Organisation, Cell Structure & Function, Plant Physiology, Human Physiology, Reproduction, Genetics & Evolution, Biology & Human Welfare, Biotechnology, Ecology

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus for broad coverage; avoid repeating the same topic in consecutive questions.

DIFFICULTY: For question {{question_number}} of {{total_in_section}}, aim for a mix: first 30% easier, middle 50% medium, last 20% harder (easy / medium / hard).

STYLE:
- All questions are multiple choice with single correct answer; exactly 4 options; plausible distractors; NTA NEET style.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, clear, and suitable for NEET preparation.`,

  CUET: `You are an expert CUET (Common University Entrance Test) paper setter. Generate one question per call matching the current NTA CUET (UG) pattern for central and participating universities.

SLOT: Question {{question_number}} of {{total_in_section}} in {{section_name}} ({{section_type}}), {{exam_name}}.
QUESTION TYPE: {{question_type}}

SYLLABUS for {{subject}}: Align with NTA CUET (UG) domain/general test syllabus. Cover core topics from the relevant subject (Physics, Chemistry, Mathematics, Biology, or General Test / Reasoning / Quantitative Aptitude as applicable).

COVERAGE: This is question {{question_number}} of {{total_in_section}}. Choose a topic from the syllabus for broad coverage across the section; avoid repeating the same topic in consecutive questions.

DIFFICULTY: For question {{question_number}} of {{total_in_section}}, set difficulty (easy / medium / hard) with a mix: first 30% easier, middle 50% medium, last 20% harder.

STYLE:
- Multiple choice, single correct answer; exactly 4 options; plausible distractors; clarity and precision; NTA CUET style.
- Use standard symbols; in JSON escape LaTeX with double backslashes (e.g. \\\\Omega, \\\\frac{1}{2}).
- Solution must be complete, step-by-step, and suitable for CUET preparation.`,
};

const EXAM_CODES = ['JEE_MAIN', 'JEE_ADVANCED', 'NEET', 'CUET'];

async function main() {
  try {
    console.log('Deleting all rows from exam_mock_prompts...\n');
    await db.query('DELETE FROM exam_mock_prompts');
    console.log('  exam_mock_prompts cleared.\n');

    console.log('Seeding exam_mock_prompts for all 4 exams...\n');

    for (const code of EXAM_CODES) {
      const examRes = await db.query(
        'SELECT id, name FROM exams_taxonomies WHERE code = $1',
        [code]
      );
      if (examRes.rows.length === 0) {
        console.log(`  Skipped ${code}: exam not found in exams_taxonomies`);
        continue;
      }
      const exam = examRes.rows[0];
      const prompt = PROMPTS[code];
      await db.query(
        `INSERT INTO exam_mock_prompts (exam_id, prompt, updated_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (exam_id) DO UPDATE SET
           prompt = EXCLUDED.prompt,
           updated_at = CURRENT_TIMESTAMP`,
        [exam.id, prompt]
      );
      console.log(`  ${exam.name} (${code}) - ID: ${exam.id}`);
    }

    console.log('\nDone. All 4 exam prompts seeded.');
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    if (db.pool) await db.pool.end();
    process.exit(0);
  }
}

main();
