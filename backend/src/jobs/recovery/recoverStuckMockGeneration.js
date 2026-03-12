/**
 * On startup, recover mock generation jobs that may have been lost (e.g. backend restart).
 * For each exam where users have started mocks, ensure the next mock is being generated.
 */
const db = require('../../config/database');

function getMockGenerationQueueLazy() {
  try {
    const { getMockGenerationQueue } = require('../queues/mockGenerationQueue');
    return getMockGenerationQueue();
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') return null;
    throw err;
  }
}

/**
 * Find (exam_id, next_mock_number) pairs where:
 * - Users have started at least one mock for this exam
 * - The next mock (max started + 1) doesn't exist or is stuck (generating with 0 questions, or failed)
 */
async function findMocksNeedingRecovery() {
  const result = await db.query(`
    WITH started_mocks AS (
      SELECT ta.exam_id, MAX(mt.order_index) AS max_started
      FROM user_exam_attempts ta
      JOIN exam_mocks mt ON ta.exam_mock_id = mt.id
      WHERE ta.exam_mock_id IS NOT NULL
      GROUP BY ta.exam_id
    ),
    next_mocks AS (
      SELECT sm.exam_id, sm.max_started + 1 AS next_number
      FROM started_mocks sm
    ),
    with_status AS (
      SELECT nm.exam_id, nm.next_number,
             em.id AS existing_mock_id,
             em.status AS existing_status,
             (SELECT COUNT(*)::int FROM exam_mock_questions WHERE exam_mock_id = em.id) AS existing_question_count
      FROM next_mocks nm
      LEFT JOIN exam_mocks em ON em.exam_id = nm.exam_id AND em.order_index = nm.next_number
    )
    SELECT exam_id, next_number, existing_mock_id, existing_status, existing_question_count
    FROM with_status
    WHERE existing_mock_id IS NULL
       OR existing_status = 'failed'
       OR (existing_status = 'generating' AND existing_question_count = 0)
  `);
  return result.rows;
}

/**
 * Trigger generation for a mock. Creates exam_mocks row if needed, enqueues job.
 */
async function triggerGeneration(examId, mockNumber, existingMockId) {
  const MockTest = require('../../models/test/MockTest');
  const queue = getMockGenerationQueueLazy();

  let mockTestId = existingMockId;
  if (!mockTestId) {
    const created = await MockTest.createGenerating(examId, mockNumber, 'system');
    if (!created) return; // already exists, another process is handling it
    mockTestId = created.id;
  } else {
    // Reset stuck/failed mock to generating
    await db.query(
      "UPDATE exam_mocks SET status = 'generating' WHERE id = $1 AND status != 'ready'",
      [mockTestId]
    );
  }

  if (queue) {
    await queue.add('generate', { examId, mockNumber, mockTestId }, {
      jobId: `mock-gen-${examId}-${mockNumber}`,
    });
    console.log(`🔄 [Recovery] Triggered mock ${mockNumber} for exam ${examId} (BullMQ)`);
  } else {
    const { runMockGenerationSync } = require('../workers/mockGenerationWorker');
    setImmediate(() => {
      runMockGenerationSync({ examId, mockNumber, mockTestId })
        .then(() => console.log(`✅ [Recovery] Mock ${mockNumber} for exam ${examId} generated`))
        .catch((err) => {
          console.error(`❌ [Recovery] Mock ${mockNumber} failed:`, err.message);
          db.query("UPDATE exam_mocks SET status = 'failed' WHERE id = $1", [mockTestId]).catch(() => {});
        });
    });
    console.log(`🔄 [Recovery] Triggered mock ${mockNumber} for exam ${examId} (inline)`);
  }
}

/**
 * Run recovery: find and trigger generation for any stuck/lost mocks.
 */
async function runRecovery() {
  try {
    const needsRecovery = await findMocksNeedingRecovery();
    if (needsRecovery.length === 0) {
      return;
    }
    console.log(`🔄 [Recovery] Found ${needsRecovery.length} mock(s) needing recovery`);
    for (const row of needsRecovery) {
      await triggerGeneration(row.exam_id, row.next_number, row.existing_mock_id);
    }
  } catch (err) {
    console.error('❌ [Recovery] Failed to run mock generation recovery:', err.message);
  }
}

module.exports = { runRecovery, findMocksNeedingRecovery };
