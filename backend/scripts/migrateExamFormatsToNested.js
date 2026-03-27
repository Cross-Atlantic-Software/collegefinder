/**
 * Migrate exam formats from flat to nested structure.
 * Flat: { name, duration, sections, rules, ... }
 * Nested: { "default": { name, duration_minutes, sections, rules, ... } }
 *
 * Run from repo root: node backend/scripts/migrateExamFormatsToNested.js
 * Or from backend: npm run migrate-exam-formats
 */

require('dotenv').config();
const db = require('../src/config/database');

function isFlatFormat(format) {
  if (!format || typeof format !== 'object') return false;
  // Flat format has "sections" at top level (object) and "name" at top level
  return (
    format.sections &&
    typeof format.sections === 'object' &&
    format.name != null
  );
}

function toNestedFormat(flat) {
  const durationMinutes = flat.duration ? Math.round(flat.duration / 60) : 180;
  const markingScheme = flat.marking_scheme || { correct: 4, incorrect: -1, unattempted: 0 };
  const marksPerQuestion = markingScheme.correct ?? 4;
  const sections = flat.sections || {};
  const sectionsWithNames = {};
  for (const [key, config] of Object.entries(sections)) {
    const subsections = (config && config.subsections) || {};
    const subsectionsWithMeta = {};
    let sectionMarks = 0;
    for (const [subKey, subConfig] of Object.entries(subsections)) {
      const count = (subConfig && (subConfig.count ?? subConfig.questions)) ?? 0;
      subsectionsWithMeta[subKey] = {
        ...subConfig,
        type: (subConfig && subConfig.type) || 'mcq_single',
        questions: (subConfig && subConfig.questions) ?? count,
        marks_per_question: (subConfig && subConfig.marks_per_question) ?? marksPerQuestion,
      };
      sectionMarks += ((subConfig && subConfig.questions) ?? count) * ((subConfig && subConfig.marks_per_question) ?? marksPerQuestion);
    }
    sectionsWithNames[key] = {
      ...config,
      name: (config && config.name) || key,
      marks: (config && config.marks) ?? sectionMarks,
      subsections: subsectionsWithMeta,
    };
  }
  return {
    default: {
      name: flat.name,
      duration_minutes: durationMinutes,
      total_questions: flat.total_questions,
      total_marks: flat.total_marks,
      marking_scheme: markingScheme,
      rules: flat.rules || [],
      sections: sectionsWithNames,
    },
  };
}

async function main() {
  try {
    console.log('🔄 Migrating exam formats to nested structure...\n');

    const result = await db.query(
      'SELECT id, name, code, format FROM exams_taxonomies WHERE format IS NOT NULL AND format != \'{}\'::jsonb'
    );
    const exams = result.rows;

    if (exams.length === 0) {
      console.log('No exams with format data found.');
      process.exit(0);
    }

    let migrated = 0;
    for (const exam of exams) {
      const format = exam.format;
      if (isFlatFormat(format)) {
        const nested = toNestedFormat(format);
        await db.query(
          'UPDATE exams_taxonomies SET format = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [JSON.stringify(nested), exam.id]
        );
        console.log(`✅ Migrated: ${exam.name} (${exam.code}) - ID: ${exam.id}`);
        migrated++;
      } else {
        console.log(`⏭️  Skipped (already nested): ${exam.name} (${exam.code}) - ID: ${exam.id}`);
      }
    }

    console.log(`\n✨ Done! Migrated ${migrated} exam(s).`);
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
