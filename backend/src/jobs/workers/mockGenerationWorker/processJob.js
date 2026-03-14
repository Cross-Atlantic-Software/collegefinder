/**
 * Core processor: generates questions for a mock test and saves them to the DB.
 * Supports resume from checkpoint (after backend restart), batch generation to avoid
 * API limits, and lock extension to prevent stalling.
 *
 * Job data shape: { examId: number, mockNumber: number, mockTestId: number }
 */
const db = require('../../../config/database');
const geminiService = require('../../../services/geminiService');
const { buildQuestionParamsList } = require('./buildParams');
const { KNOWN_TYPES, BATCH_SIZE, GEMINI_CONCURRENCY, FAILED_QUESTION_RETRIES } = require('./config');

/**
 * Extend job lock if available (BullMQ). No-op when running sync (no job).
 */
async function extendLock(job) {
  if (job && typeof job.extendLock === 'function') {
    try {
      await job.extendLock(30000); // extend by 30 seconds
    } catch (e) {
      // Ignore if lock is not extendable
    }
  }
}

/**
 * Normalize section_type for DB constraint (only 'MCQ' or 'Numerical' allowed).
 */
function normalizeSectionType(val) {
  if (!val) return null;
  const t = String(val).toLowerCase().trim();
  if (t === 'numerical' || t.includes('numerical') || t === 'integer') return 'Numerical';
  if (t === 'mcq' || t.includes('mcq') || t === 'mcq_single' || t === 'mcq_multiple') return 'MCQ';
  return null;
}

/**
 * Update job progress if available. No-op when running sync.
 */
function updateProgress(job, completed, total) {
  if (job && typeof job.updateProgress === 'function') {
    try {
      job.updateProgress({ completed, total }).catch(() => {});
    } catch (e) {}
  }
}

async function processMockGeneration(job) {
  const { examId, mockNumber, mockTestId } = job.data;

  console.log(`🔄 [Worker] Starting mock generation: exam=${examId}, mock=${mockNumber}, id=${mockTestId}`);

  const examResult = await db.query('SELECT * FROM exams_taxonomies WHERE id = $1', [examId]);
  const exam = examResult.rows[0];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  const mockResult = await db.query('SELECT * FROM exam_mocks WHERE id = $1', [mockTestId]);
  const mockTest = mockResult.rows[0];
  if (!mockTest) {
    throw new Error(`MockTest ${mockTestId} not found`);
  }
  if (mockTest.status === 'ready') {
    console.log(`ℹ️  [Worker] MockTest ${mockTestId} already ready — skipping`);
    return;
  }

  // --- Resume: count existing questions ---
  const countResult = await db.query(
    'SELECT COUNT(*)::int AS n FROM exam_mock_questions WHERE exam_mock_id = $1',
    [mockTestId]
  );
  const existingCount = countResult.rows[0].n;
  if (existingCount > 0) {
    console.log(`📋 [Worker] Resuming from question ${existingCount + 1} (${existingCount} already saved)`);
  }

  const questionParams = await buildQuestionParamsList(exam);
  const totalNeeded = questionParams.length;
  const paramsToGenerate = questionParams.slice(existingCount);

  // Early guard: another job may have already completed this mock
  if (existingCount >= totalNeeded) {
    const totalResult = await db.query(
      'SELECT COUNT(*)::int AS n FROM exam_mock_questions WHERE exam_mock_id = $1',
      [mockTestId]
    );
    const total = totalResult.rows[0].n;
    await db.query(
      "UPDATE exam_mocks SET status = 'ready', total_questions = $1 WHERE id = $2",
      [total, mockTestId]
    );
    await db.query(
      'UPDATE exams_taxonomies SET total_mocks_generated = total_mocks_generated + 1 WHERE id = $1',
      [examId]
    );
    console.log(`✅ [Worker] Mock ${mockNumber} already complete — marked ready (${total} questions)`);
    return;
  }

  console.log(`📋 [Worker] Generating ${paramsToGenerate.length} questions for mock ${mockNumber} of "${exam.name}" (${existingCount}/${totalNeeded} done)`);

  const allInserted = [];
  let unknownTypes = new Set();

  // Process in batches of BATCH_SIZE
  for (let i = 0; i < paramsToGenerate.length; i += BATCH_SIZE) {
    await extendLock(job);

    // Re-check: another job may have finished while we were generating
    const recheckResult = await db.query(
      'SELECT COUNT(*)::int AS n FROM exam_mock_questions WHERE exam_mock_id = $1',
      [mockTestId]
    );
    const currentCount = recheckResult.rows[0].n;
    if (currentCount >= totalNeeded) {
      console.log(`✅ [Worker] Mock ${mockNumber} already complete (${currentCount} questions) — stopping`);
      return;
    }

    const batchParams = paramsToGenerate.slice(i, i + BATCH_SIZE);
    const batchResult = await geminiService.generateQuestionsBatch(batchParams, GEMINI_CONCURRENCY);

    if (batchResult.successCount === 0) {
      throw new Error(`Batch of ${batchParams.length} question generations failed for exam ${examId}`);
    }

    const insertedQuestions = [];
    const startOrderIndex = existingCount + i + 1;

    // Retry failed questions in this batch (e.g. parse errors from malformed Gemini JSON)
    if (batchResult.failed && batchResult.failed.length > 0) {
      console.log(`🔄 [Worker] Retrying ${batchResult.failed.length} failed question(s) (max ${FAILED_QUESTION_RETRIES} attempts each)`);
      for (const { index: failIndex, error } of batchResult.failed) {
        const param = batchParams[failIndex];
        if (!param) continue;
        let question = null;
        for (let attempt = 1; attempt <= FAILED_QUESTION_RETRIES && !question; attempt++) {
          try {
            question = await geminiService.generateQuestion(param);
            batchResult.successful.push({ question, index: failIndex });
            console.log(`✅ [Worker] Retry ${attempt} succeeded for question at index ${failIndex}`);
          } catch (retryErr) {
            console.warn(`⚠️  [Worker] Retry ${attempt}/${FAILED_QUESTION_RETRIES} failed for index ${failIndex}:`, retryErr.message);
          }
        }
        if (!question) {
          console.warn(`⚠️  [Worker] Question at index ${failIndex} failed after ${FAILED_QUESTION_RETRIES} retries (${error})`);
        }
      }
    }

    for (const { question, index } of batchResult.successful) {
      try {
        const questionTypeToSave = (question.question_type && String(question.question_type).trim()) || 'mcq_single';
        if (!KNOWN_TYPES.includes(questionTypeToSave)) {
          unknownTypes.add(questionTypeToSave);
          console.warn(`⚠️  [Worker] Unknown question_type "${questionTypeToSave}" — saving as-is and sending email`);
        }

        const origParams = batchParams[index] || {};
        const marksToSave = origParams.marks || question.marks || 4;
        const negMarksToSave = origParams.negative_marks != null ? origParams.negative_marks : (question.negative_marks != null ? question.negative_marks : 1);

        const paragraph_context = question.paragraph_context || null;
        const assertion = question.assertion || null;
        const reason = question.reason || null;
        const match_pairs = question.match_pairs ? JSON.stringify(question.match_pairs) : '[]';

        const insertResult = await db.query(`
          INSERT INTO questions (
            subject, unit, topic, sub_topic, concept_tags, difficulty,
            question_type, paragraph_context, assertion, reason, match_pairs,
            question_text, options, correct_option, solution_text,
            marks, negative_marks, source, generation_prompt_version,
            section_name, section_type, image_url
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
          RETURNING id
        `, [
          question.subject,
          question.unit || null,
          question.topic || null,
          question.sub_topic || null,
          question.concept_tags || [],
          question.difficulty,
          questionTypeToSave,
          paragraph_context,
          assertion,
          reason,
          match_pairs,
          question.question_text,
          JSON.stringify(question.options || []),
          question.correct_option,
          question.solution_text || '',
          marksToSave,
          negMarksToSave,
          question.source || 'LLM',
          question.generation_prompt_version || 'v2.0',
          question.section_name || null,
          normalizeSectionType(origParams.section_type || question.section_type) || null,
          question.image_url || null,
        ]);
        const qId = insertResult.rows[0].id;
        insertedQuestions.push(qId);

        const orderIndex = startOrderIndex + index;
        await db.query(`
          INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (exam_mock_id, question_id) DO NOTHING
        `, [mockTestId, qId, examId, orderIndex]);
      } catch (insertErr) {
        console.warn(`⚠️  [Worker] Failed to insert question:`, insertErr.message);
        if (insertErr.message?.includes('violates check constraint')) {
          unknownTypes.add(question.question_type || 'unknown');
          try {
            const emailService = require('../../../services/emailAlertService');
            await emailService.sendUnknownQuestionTypeAlert(question.question_type, null, { error: insertErr.message, exam: exam.name, mockNumber });
          } catch (emailErr) {
            console.warn('⚠️  Email alert failed:', emailErr?.message);
          }
        }
      }
    }

    allInserted.push(...insertedQuestions);
    const completed = existingCount + allInserted.length;
    updateProgress(job, completed, totalNeeded);
    console.log(`✅ [Worker] Batch progress: ${completed}/${totalNeeded} questions`);
  }

  if (unknownTypes.size > 0) {
    try {
      const emailService = require('../../../services/emailAlertService');
      for (const unknownType of unknownTypes) {
        await emailService.sendUnknownQuestionTypeAlert(unknownType, null, {
          exam: exam.name,
          mockNumber,
          knownTypes: KNOWN_TYPES,
          message: `Found ${unknownTypes.size} unknown type(s) during mock ${mockNumber} generation for ${exam.name}`
        });
      }
    } catch (emailErr) {
      console.warn('⚠️  Email alert failed:', emailErr?.message);
    }
  }

  const totalInserted = existingCount + allInserted.length;
  if (totalInserted === 0) {
    throw new Error('No questions could be saved to the database');
  }

  // Do not mark mock ready if we have fewer questions than needed (e.g. some generations failed after retries)
  if (totalInserted < totalNeeded) {
    const missing = totalNeeded - totalInserted;
    throw new Error(
      `Mock generation incomplete: ${totalInserted}/${totalNeeded} questions. ${missing} missing. Job will retry to fill the gap.`
    );
  }

  await db.query(`
    UPDATE exam_mocks
    SET status = 'ready', total_questions = $1
    WHERE id = $2
  `, [totalInserted, mockTestId]);

  await db.query(`
    UPDATE exams_taxonomies
    SET total_mocks_generated = total_mocks_generated + 1
    WHERE id = $1
  `, [examId]);

  console.log(`✅ [Worker] Mock ${mockNumber} ready for exam "${exam.name}" — ${totalInserted} questions`);
}

async function handleFailed(job, err) {
  const { mockTestId } = job.data || {};
  if (!mockTestId) return;

  console.error(`❌ [Worker] Mock generation failed permanently for mockTestId=${mockTestId}:`, err.message);

  try {
    await db.query(
      "UPDATE exam_mocks SET status = 'failed' WHERE id = $1 AND status != 'ready'",
      [mockTestId]
    );
  } catch (dbErr) {
    console.error('❌ [Worker] Could not update exam_mocks status to failed:', dbErr.message);
  }
}

module.exports = { processMockGeneration, handleFailed };
