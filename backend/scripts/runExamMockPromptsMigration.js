/**
 * One-off: create exam_mock_prompts table if missing (e.g. on server where migration wasn't run).
 * Run from backend dir: node scripts/runExamMockPromptsMigration.js
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../src/config/database');

const migrationPath = path.join(__dirname, '../src/database/migrations/create_exam_mock_prompts_table.sql');

async function run() {
  const sql = fs.readFileSync(migrationPath, 'utf8');
  const cleaned = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .trim();
  await db.query(cleaned);
  console.log('exam_mock_prompts migration applied.');
}

run()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.pool && db.pool.end());
