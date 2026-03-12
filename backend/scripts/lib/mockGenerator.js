/**
 * Shared core logic for Gemini-powered mock test seed scripts.
 *
 * Exports:
 *   - chunk(arr, n)                      — split array into chunks of n
 *   - buildDifficultyArray(total, dist)   — create shuffled difficulty array
 *   - initGeminiAndDb()                  — verify Gemini + connect DB
 *   - setupMockTest(examName, orderIndex) — find exam + create/reset mock row
 *   - saveBatchToDb(questions, opts)      — bulk-insert questions + link to mock
 *   - generateWithBatching(params, opts)  — orchestrate API calls + periodic saves
 *   - finalizeMock(opts)                 — mark mock ready, update exam counter
 *   - printSummary(opts)                 — print final report
 */

require('dotenv').config();
const pLimit = require('p-limit');
const db = require('../../src/config/database');
const geminiService = require('../../src/services/geminiService');

// ─── Tiny utilities ──────────────────────────────────────────────────────────

/** Split an array into chunks of at most `n` elements. */
function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Build a difficulty array of length `total` according to `dist`
 * ({ easy, medium, hard } fractions that sum to 1), then Fisher-Yates shuffle.
 */
function buildDifficultyArray(total, dist = { easy: 0.30, medium: 0.50, hard: 0.20 }) {
  const easyCount  = Math.round(total * dist.easy);
  const hardCount  = Math.round(total * dist.hard);
  const medCount   = total - easyCount - hardCount;
  const arr = [
    ...Array(easyCount).fill('easy'),
    ...Array(medCount).fill('medium'),
    ...Array(hardCount).fill('hard'),
  ];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ─── Gemini + DB init ─────────────────────────────────────────────────────────

async function initGeminiAndDb() {
  try {
    await geminiService.ensureInitialized();
    console.log('✅ Gemini service initialized\n');
  } catch (err) {
    console.error('❌ Gemini service unavailable:', err.message);
    console.error('   Make sure GOOGLE_API_KEY is set in backend/.env');
    process.exit(1);
  }
  try {
    await db.init();
    console.log('✅ Database connected\n');
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  }
}

// ─── Mock setup ───────────────────────────────────────────────────────────────

/**
 * Look up the exam by name, then create (or reset) the exam_mocks row.
 * Returns { examId, mockTestId, existingCount }.
 *
 * @param {string} examName
 * @param {number} orderIndex
 * @param {object} [opts]
 * @param {boolean} [opts.resume] — if true, keep existing questions and return count
 */
async function setupMockTest(examName, orderIndex, opts = {}) {
  const resume = opts.resume === true;

  const examRow = await db.query(
    'SELECT id FROM exams_taxonomies WHERE LOWER(name) = LOWER($1)',
    [examName]
  );
  if (examRow.rows.length === 0) {
    console.error(`❌ Exam "${examName}" not found. Run seed-three-exams first.`);
    process.exit(1);
  }
  const examId = examRow.rows[0].id;
  console.log(`✅ Exam: ${examName} (ID: ${examId})\n`);

  const existing = await db.query(
    'SELECT id FROM exam_mocks WHERE exam_id = $1 AND order_index = $2',
    [examId, orderIndex]
  );
  let mockTestId;
  let existingCount = 0;

  if (existing.rows.length > 0) {
    mockTestId = existing.rows[0].id;
    await db.query("UPDATE exam_mocks SET status = 'generating' WHERE id = $1", [mockTestId]);

    if (resume) {
      const countRow = await db.query(
        'SELECT COUNT(*)::int AS n FROM exam_mock_questions WHERE exam_mock_id = $1',
        [mockTestId]
      );
      existingCount = countRow.rows[0].n;
      console.log(`♻️  Resuming Mock ${orderIndex} — ${existingCount} questions already saved\n`);
    } else {
      await db.query('DELETE FROM exam_mock_questions WHERE exam_mock_id = $1', [mockTestId]);
      console.log(`♻️  Reusing existing Mock ${orderIndex}, clearing old questions\n`);
    }
  } else {
    const ins = await db.query(
      `INSERT INTO exam_mocks (exam_id, order_index, status, created_by)
       VALUES ($1, $2, 'generating', 'system') RETURNING id`,
      [examId, orderIndex]
    );
    mockTestId = ins.rows[0].id;
    console.log(`✨ Created new Mock ${orderIndex}\n`);
  }
  return { examId, mockTestId, existingCount };
}

/**
 * Get question count per subject for a mock (from questions table via exam_mock_questions).
 * @param {number} mockTestId
 * @returns {Promise<Record<string, number>>} e.g. { Physics: 25, Chemistry: 20, Mathematics: 5 }
 */
async function getMockSubjectCounts(mockTestId) {
  const result = await db.query(
    `SELECT q.subject, COUNT(*)::int AS n
     FROM exam_mock_questions emq
     JOIN questions q ON q.id = emq.question_id
     WHERE emq.exam_mock_id = $1
     GROUP BY q.subject`,
    [mockTestId]
  );
  const counts = {};
  for (const row of result.rows) {
    counts[row.subject] = parseInt(row.n, 10);
  }
  return counts;
}

// ─── Save batch to DB ─────────────────────────────────────────────────────────

/**
 * Insert an array of generated question objects into `questions` and
 * link them to the mock via `exam_mock_questions`.
 *
 * @param {object[]} questions  — processed question objects from geminiService
 * @param {object}   opts
 * @param {number}   opts.examId
 * @param {number}   opts.mockTestId
 * @param {number}   opts.startOrderIndex — 1-based order index of questions[0]
 * @returns {number[]} inserted question IDs
 */
async function saveBatchToDb(questions, { examId, mockTestId, startOrderIndex }) {
  if (!questions || questions.length === 0) return [];
  console.log(`  📝 Saving ${questions.length} questions (order ${startOrderIndex}–${startOrderIndex + questions.length - 1})`);

  const savedIds = [];
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const orderIndex = startOrderIndex + i;
    try {
      const result = await db.query(
        `INSERT INTO questions (
           subject, section_name, section_type, unit, topic, sub_topic,
           concept_tags, difficulty, question_type, question_text, options,
           correct_option, solution_text, marks, negative_marks,
           source, generation_prompt_version, image_url
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
         RETURNING id`,
        [
          q.subject,
          q.section_name  || null,
          q.section_type  || null,
          q.unit          || null,
          q.topic         || null,
          q.sub_topic     || null,
          q.concept_tags  || [],
          q.difficulty,
          q.question_type,
          q.question_text,
          JSON.stringify(q.options || []),
          q.correct_option,
          q.solution_text || '',
          q.marks,
          q.negative_marks,
          q.source || 'LLM',
          q.generation_prompt_version || 'v2.0',
          q.image_url || null,
        ]
      );
      const questionId = result.rows[0].id;
      await db.query(
        `INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
         VALUES ($1,$2,$3,$4) ON CONFLICT (exam_mock_id, question_id) DO NOTHING`,
        [mockTestId, questionId, examId, orderIndex]
      );
      savedIds.push(questionId);
    } catch (err) {
      console.error(`      ❌ Failed to save Q${orderIndex}: ${err.message}`);
    }
  }
  console.log(`  ✅ ${savedIds.length} saved`);
  return savedIds;
}

// ─── Orchestrated generation ──────────────────────────────────────────────────

/**
 * Generate all questions, saving to DB every `saveBatchSize` questions.
 *
 * @param {object[]} allParams
 * @param {object}   opts
 * @param {number}   opts.examId
 * @param {number}   opts.mockTestId
 * @param {number}   [opts.existingCount=0] — when resuming, number of questions already in mock
 * @param {number}   [opts.questionsPerRequest=5]
 * @param {number}   [opts.concurrency=3]
 * @param {number}   [opts.saveBatchSize=10]
 * @param {number}   [opts.delayBetweenBatchesMs=1500]
 * @returns {{ successful, failed, savedCount }}
 */
async function generateWithBatching(allParams, {
  examId,
  mockTestId,
  existingCount     = 0,
  questionsPerRequest = 5,
  concurrency        = 3,
  saveBatchSize      = 10,
  delayBetweenBatchesMs = 1500,
  startOrderIndex    = 1,
} = {}) {
  const total       = allParams.length;
  const chunks      = chunk(allParams, questionsPerRequest);
  const limit       = pLimit(concurrency);
  const successful  = [];
  const failed      = [];
  let savedCount    = 0;
  let pendingSave   = [];
  let attempted     = 0;

  console.log(`\n📊 Generating ${total} questions`);
  if (existingCount > 0) {
    console.log(`   Resuming: ${existingCount} already saved, ${total} remaining to generate`);
  }
  if (startOrderIndex > 1) {
    console.log(`   Saving at order_index ${startOrderIndex}+`);
  }
  console.log(`   API calls: ${chunks.length} × up to ${questionsPerRequest} (${concurrency} concurrent)`);
  console.log(`   Saving every ${saveBatchSize} questions\n`);

  for (let c = 0; c < chunks.length; c += concurrency) {
    const batchSlice   = chunks.slice(c, c + concurrency);
    const firstNum     = c + 1;
    const lastNum      = Math.min(c + concurrency, chunks.length);
    console.log(`\n🔢 API calls ${firstNum}–${lastNum} of ${chunks.length}`);
    console.log('─'.repeat(60));

    const results = await Promise.all(
      batchSlice.map((paramsChunk) =>
        limit(async () => {
          try {
            const questions = await geminiService.generateFiveQuestions(paramsChunk);
            return { success: true, questions, paramsChunk };
          } catch (err) {
            return { success: false, error: err.message, paramsChunk };
          }
        })
      )
    );

    for (const res of results) {
      if (res.success) {
        for (let k = 0; k < res.questions.length; k++) {
          successful.push({ question: res.questions[k], params: res.paramsChunk[k] });
          pendingSave.push(res.questions[k]);
          console.log(`  ✓ ${res.questions[k].subject} — ${res.questions[k].topic || res.paramsChunk[k]?.topic || '?'} (${res.questions[k].difficulty})`);
        }
        attempted += res.questions.length;
      } else {
        // Retry each failed param one-at-a-time (more reliable than batch)
        for (const p of res.paramsChunk) {
          try {
            const [question] = await geminiService.generateFiveQuestions([p]);
            successful.push({ question, params: p });
            pendingSave.push(question);
            console.log(`  ✓ ${p.subject} — ${p.topic || '?'} (${question.difficulty}) [retry]`);
            attempted += 1;
          } catch (retryErr) {
            failed.push({ params: p, error: retryErr.message });
            console.log(`  ✗ ${p.subject} — ${p.topic || '?'} → ${retryErr.message}`);
            attempted += 1;
          }
        }
      }
    }

    const isLast   = c + concurrency >= chunks.length;
    const doSave   = pendingSave.length >= saveBatchSize || (isLast && pendingSave.length > 0);

    if (doSave) {
      const batchStart = startOrderIndex + savedCount;
      const ids    = await saveBatchToDb(pendingSave, { examId, mockTestId, startOrderIndex: batchStart });
      savedCount  += ids.length;
      console.log(`  💾 Cumulative saved: ${savedCount}/${total}`);
      pendingSave  = [];
    }

    if (!isLast) await new Promise((r) => setTimeout(r, delayBetweenBatchesMs));
  }

  return { successful, failed, savedCount };
}

// ─── Finalize ─────────────────────────────────────────────────────────────────

/**
 * Mark the mock as ready, update the exam's total_mocks_generated counter.
 */
async function finalizeMock({ examId, mockTestId, savedCount }) {
  await db.query(
    "UPDATE exam_mocks SET status = 'ready', total_questions = $1 WHERE id = $2",
    [savedCount, mockTestId]
  );
  const countRow = await db.query(
    'SELECT COALESCE(MAX(order_index), 0) AS n FROM exam_mocks WHERE exam_id = $1',
    [examId]
  );
  const total = parseInt(countRow.rows[0].n, 10);
  await db.query(
    'UPDATE exams_taxonomies SET total_mocks_generated = $1 WHERE id = $2',
    [total, examId]
  );
}

// ─── Summary printer ─────────────────────────────────────────────────────────

/**
 * Print a nicely formatted generation summary.
 *
 * @param {object} opts
 * @param {string}   opts.examName
 * @param {number}   opts.orderIndex
 * @param {number}   opts.savedCount
 * @param {number}   opts.totalParams
 * @param {object[]} opts.failed
 * @param {object[]} opts.successful
 * @param {number}   opts.durationMs
 * @param {number}   opts.marksPerQuestion       — used for total-marks display
 * @param {string[]} opts.subjects                — list of subject names for per-subject breakdown
 * @param {number}   opts.minAcceptable           — minimum questions for a valid mock
 */
function printSummary({
  examName, orderIndex, savedCount, totalParams, failed, successful,
  durationMs, marksPerQuestion = 4, subjects = [], minAcceptable = 40,
}) {
  const duration = (durationMs / 1000 / 60).toFixed(2);
  const sep = '='.repeat(70);
  console.log('\n' + sep);
  console.log('📊 GENERATION SUMMARY');
  console.log(sep);
  console.log(`  Exam:             ${examName}`);
  console.log(`  Mock Number:      ${orderIndex}`);
  console.log(`  Saved / Total:    ${savedCount} / ${totalParams}`);
  console.log(`  Failed:           ${failed.length}`);
  console.log(`  Total Marks:      ${savedCount * marksPerQuestion}`);
  console.log(`  Time:             ${duration} min`);

  if (subjects.length > 0) {
    console.log('\n  Per-subject breakdown:');
    for (const sub of subjects) {
      const sq  = successful.filter(q => q.params.subject === sub);
      const mcq = sq.filter(q => q.params.question_type === 'mcq_single').length;
      const mul = sq.filter(q => q.params.question_type === 'mcq_multiple').length;
      const num = sq.filter(q => q.params.question_type === 'numerical').length;
      const parts = [];
      if (mcq) parts.push(`${mcq} MCQ`);
      if (mul) parts.push(`${mul} Multi`);
      if (num) parts.push(`${num} Numerical`);
      console.log(`    ${sub.padEnd(14)}: ${sq.length} q  (${parts.join(' + ')})`);
    }
  }

  if (failed.length > 0) {
    console.log('\n  ⚠️  Failed questions:');
    failed.slice(0, 10).forEach((f, i) => {
      console.log(`    ${i + 1}. ${f.params.subject} — ${f.params.topic} (${f.params.difficulty})`);
      console.log(`       ${f.error}`);
    });
    if (failed.length > 10) console.log(`    … and ${failed.length - 10} more`);
  }

  console.log(sep);
  if (savedCount >= minAcceptable) {
    console.log('✅ MOCK TEST GENERATED SUCCESSFULLY');
  } else {
    console.log(`❌ TOO FEW QUESTIONS (${savedCount} < ${minAcceptable} required)`);
  }
  console.log(sep + '\n');

  return savedCount >= minAcceptable;
}

module.exports = {
  chunk,
  buildDifficultyArray,
  initGeminiAndDb,
  setupMockTest,
  getMockSubjectCounts,
  saveBatchToDb,
  generateWithBatching,
  finalizeMock,
  printSummary,
  db,
};
