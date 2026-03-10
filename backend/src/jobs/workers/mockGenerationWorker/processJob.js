/**
 * Core processor: generates questions for a mock test and saves them to the DB.
 * Job data shape: { examId: number, mockNumber: number, mockTestId: number }
 */
const db = require('../../../config/database');
const geminiService = require('../../../services/geminiService');
const { buildQuestionParamsList } = require('./buildParams');
const { KNOWN_TYPES } = require('./config');

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

  const questionParams = await buildQuestionParamsList(exam);
  console.log(`📋 [Worker] Generating ${questionParams.length} questions for mock ${mockNumber} of "${exam.name}"`);

  const batchResult = await geminiService.generateQuestionsBatch(questionParams, 3);

  if (batchResult.successCount === 0) {
    throw new Error(`All ${questionParams.length} question generations failed for exam ${examId}`);
  }

  console.log(`✅ [Worker] Generated ${batchResult.successCount}/${questionParams.length} questions`);

  const insertedQuestions = [];
  let unknownTypes = new Set();

  for (const { question, index } of batchResult.successful) {
    try {
      const questionTypeToSave = (question.question_type && String(question.question_type).trim()) || 'mcq_single';
      if (!KNOWN_TYPES.includes(questionTypeToSave)) {
        unknownTypes.add(questionTypeToSave);
        console.warn(`⚠️  [Worker] Unknown question_type "${questionTypeToSave}" — saving as-is and sending email`);
      }

      const origParams = questionParams[index] || {};
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
        question.section_type || null,
        question.image_url || null,
      ]);
      insertedQuestions.push(insertResult.rows[0].id);
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

  if (insertedQuestions.length === 0) {
    throw new Error('No questions could be saved to the database');
  }

  const mockQuestionValues = insertedQuestions.map((qId, idx) =>
    `(${mockTestId}, ${qId}, ${examId}, ${idx + 1})`
  ).join(', ');
  await db.query(`
    INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
    VALUES ${mockQuestionValues}
    ON CONFLICT (exam_mock_id, question_id) DO NOTHING
  `);

  await db.query(`
    UPDATE exam_mocks
    SET status = 'ready', total_questions = $1
    WHERE id = $2
  `, [insertedQuestions.length, mockTestId]);

  await db.query(`
    UPDATE exams_taxonomies
    SET total_mocks_generated = total_mocks_generated + 1
    WHERE id = $1
  `, [examId]);

  console.log(`✅ [Worker] Mock ${mockNumber} ready for exam "${exam.name}" — ${insertedQuestions.length} questions`);
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
