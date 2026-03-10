const { Worker } = require('bullmq');
const { getRedisConnection } = require('../redisConnection');
const db = require('../../config/database');
const geminiService = require('../../services/geminiService');

const QUEUE_NAME = 'mock-generation';

/**
 * Build the list of question generation params from an exam's format config.
 * Uses the first available format. Falls back to a generic set if no format exists.
 *
 * @param {object} exam - Row from exams_taxonomies
 * @returns {Array<object>} Array of params for geminiService.generateQuestion
 */
function buildQuestionParamsList(exam) {
  const formatConfig = exam.format && typeof exam.format === 'object' ? exam.format : {};
  const formatKeys = Object.keys(formatConfig);

  const difficulties = ['easy', 'medium', 'hard'];

  if (formatKeys.length === 0) {
    // No format defined — generate a small generic set
    const subjects = ['General'];
    const params = [];
    for (let i = 0; i < 10; i++) {
      params.push({
        exam_name: exam.name,
        subject: subjects[0],
        difficulty: difficulties[i % difficulties.length],
        question_type: 'mcq',
      });
    }
    return params;
  }

  // Use the first format (e.g. jee_main_paper1)
  const firstFormatId = formatKeys[0];
  const format = formatConfig[firstFormatId];
  const sections = format.sections || {};

  const params = [];
  let globalIndex = 0;

  for (const [sectionKey, sectionConfig] of Object.entries(sections)) {
    const sectionName = sectionConfig.name || sectionKey;
    const subsections = sectionConfig.subsections || {};

    if (Object.keys(subsections).length === 0) {
      // Section without subsections — treat as a single block
      const questionCount = sectionConfig.questions || 5;
      const sectionType = sectionConfig.type || 'MCQ';
      const questionType = sectionType === 'Numerical' ? 'numerical' : 'mcq';

      for (let i = 0; i < questionCount; i++) {
        params.push({
          exam_name: exam.name,
          subject: sectionName,
          section_name: sectionKey,
          section_type: sectionType,
          difficulty: difficulties[(globalIndex + i) % difficulties.length],
          question_type: questionType,
        });
      }
      globalIndex += questionCount;
    } else {
      for (const [subsectionKey, subsectionConfig] of Object.entries(subsections)) {
        const questionCount = subsectionConfig.questions || 5;
        const sectionType = subsectionConfig.type || subsectionConfig.section_type || 'MCQ';
        const questionType = sectionType === 'Numerical' ? 'numerical' : 'mcq';

        for (let i = 0; i < questionCount; i++) {
          params.push({
            exam_name: exam.name,
            subject: sectionName,
            section_name: sectionKey,
            section_type: sectionType,
            difficulty: difficulties[(globalIndex + i) % difficulties.length],
            question_type: questionType,
          });
        }
        globalIndex += questionCount;
      }
    }
  }

  // Safety fallback: if no params were built despite sections existing, use generic
  if (params.length === 0) {
    for (let i = 0; i < 10; i++) {
      params.push({
        exam_name: exam.name,
        subject: 'General',
        difficulty: difficulties[i % difficulties.length],
        question_type: 'mcq',
      });
    }
  }

  return params;
}

/**
 * Core processor: generates questions for a mock test and saves them to the DB.
 *
 * Job data shape: { examId: number, mockNumber: number, mockTestId: number }
 */
async function processMockGeneration(job) {
  const { examId, mockNumber, mockTestId } = job.data;

  console.log(`🔄 [Worker] Starting mock generation: exam=${examId}, mock=${mockNumber}, id=${mockTestId}`);

  // 1. Fetch exam
  const examResult = await db.query('SELECT * FROM exams_taxonomies WHERE id = $1', [examId]);
  const exam = examResult.rows[0];
  if (!exam) {
    throw new Error(`Exam ${examId} not found`);
  }

  // 2. Confirm mock_test row still exists and is in generating/failed state
  const mockResult = await db.query('SELECT * FROM exam_mocks WHERE id = $1', [mockTestId]);
  const mockTest = mockResult.rows[0];
  if (!mockTest) {
    throw new Error(`MockTest ${mockTestId} not found`);
  }
  if (mockTest.status === 'ready') {
    console.log(`ℹ️  [Worker] MockTest ${mockTestId} already ready — skipping`);
    return;
  }

  // 3. Build question params from exam format
  const questionParams = buildQuestionParamsList(exam);
  console.log(`📋 [Worker] Generating ${questionParams.length} questions for mock ${mockNumber} of "${exam.name}"`);

  // 4. Generate questions via Gemini (batch, 3 concurrent)
  const batchResult = await geminiService.generateQuestionsBatch(questionParams, 3);

  if (batchResult.successCount === 0) {
    throw new Error(`All ${questionParams.length} question generations failed for exam ${examId}`);
  }

  console.log(`✅ [Worker] Generated ${batchResult.successCount}/${questionParams.length} questions`);

  // 5. Insert generated questions into the questions table
  const insertedQuestions = [];
  for (const { question } of batchResult.successful) {
    try {
      const insertResult = await db.query(`
        INSERT INTO questions (
          subject, unit, topic, sub_topic, concept_tags, difficulty,
          question_type, question_text, options, correct_option, solution_text,
          marks, negative_marks, source, generation_prompt_version,
          section_name, section_type, image_url
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
        RETURNING id
      `, [
        question.subject,
        question.unit || null,
        question.topic || null,
        question.sub_topic || null,
        question.concept_tags || [],
        question.difficulty,
        question.question_type,
        question.question_text,
        JSON.stringify(question.options || []),
        question.correct_option,
        question.solution_text || '',
        question.marks || 1,
        question.negative_marks || 0.25,
        question.source || 'LLM',
        question.generation_prompt_version || 'v1.0',
        question.section_name || null,
        question.section_type || null,
        question.image_url || null,
      ]);
      insertedQuestions.push(insertResult.rows[0].id);
    } catch (insertErr) {
      console.warn(`⚠️  [Worker] Failed to insert question:`, insertErr.message);
    }
  }

  if (insertedQuestions.length === 0) {
    throw new Error('No questions could be saved to the database');
  }

  // 6. Bulk insert exam_mock_questions mapping
  const mockQuestionValues = insertedQuestions.map((qId, idx) => 
    `(${mockTestId}, ${qId}, ${examId}, ${idx + 1})`
  ).join(', ');
  await db.query(`
    INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index)
    VALUES ${mockQuestionValues}
    ON CONFLICT (exam_mock_id, question_id) DO NOTHING
  `);

  // 7. Mark mock as ready and record total_questions
  await db.query(`
    UPDATE exam_mocks
    SET status = 'ready', total_questions = $1
    WHERE id = $2
  `, [insertedQuestions.length, mockTestId]);

  // 8. Increment total_mocks_generated on the exam
  await db.query(`
    UPDATE exams_taxonomies
    SET total_mocks_generated = total_mocks_generated + 1
    WHERE id = $1
  `, [examId]);

  console.log(`✅ [Worker] Mock ${mockNumber} ready for exam "${exam.name}" — ${insertedQuestions.length} questions`);
}

/**
 * Error handler: marks the mock as failed after all retry attempts are exhausted.
 */
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

/**
 * Starts the BullMQ worker that processes mock generation jobs.
 * Safe to call at server startup — errors are caught so the server keeps running.
 */
function startMockGenerationWorker() {
  const worker = new Worker(QUEUE_NAME, processMockGeneration, {
    connection: getRedisConnection(),
    concurrency: 2, // Max 2 mocks being generated at the same time
  });

  worker.on('completed', (job) => {
    console.log(`✅ [Worker] Job ${job.id} completed (mock generation)`);
  });

  worker.on('failed', handleFailed);

  worker.on('error', (err) => {
    console.error('❌ [Worker] mockGenerationWorker error:', err.message);
  });

  console.log('🟢 mockGenerationWorker started');
  return worker;
}

/**
 * Run mock generation inline (e.g. from seed script).
 * Same logic as the BullMQ job processor. jobData = { examId, mockNumber, mockTestId }.
 */
async function runMockGenerationSync(jobData) {
  return processMockGeneration({ data: jobData });
}

module.exports = { startMockGenerationWorker, runMockGenerationSync };
