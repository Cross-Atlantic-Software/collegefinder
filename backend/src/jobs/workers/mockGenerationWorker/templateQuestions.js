/**
 * Generate placeholder MCQ questions locally (no Gemini).
 * Used when MOCK_USE_TEMPLATE_QUESTIONS=true for local dev / quota exhaustion.
 */
const db = require('../../../config/database');

function normalizeSectionType(val) {
  if (!val) return null;
  const t = String(val).toLowerCase().trim();
  if (t === 'numerical' || t.includes('numerical') || t === 'integer') return 'Numerical';
  if (t === 'mcq' || t.includes('mcq') || t === 'mcq_single' || t === 'mcq_multiple') return 'MCQ';
  return null;
}

function buildTemplateQuestion(param, globalIndex) {
  const subject = param.subject || 'General';
  const topic = param.topic || subject;
  const qNum = param.question_number || globalIndex;
  const options = [
    { key: 'A', text: `Option A for ${subject} question ${qNum}` },
    { key: 'B', text: `Option B for ${subject} question ${qNum}` },
    { key: 'C', text: `Option C for ${subject} question ${qNum}` },
    { key: 'D', text: `Option D for ${subject} question ${qNum}` },
  ];
  return {
    subject,
    unit: null,
    topic,
    sub_topic: null,
    concept_tags: [],
    difficulty: 'medium',
    question_type: param.question_type === 'numerical' ? 'numerical' : 'mcq_single',
    question_text: `[Practice] ${subject} — Question ${qNum} (${param.exam_name || 'Mock Test'})`,
    options,
    correct_option: param.question_type === 'numerical' ? '42' : 'A',
    solution_text: 'Template question for local development.',
    marks: param.marks ?? 4,
    negative_marks: param.negative_marks ?? 1,
    source: 'LLM',
    generation_prompt_version: 'template-v1',
    section_name: param.section_name || subject,
    section_type: param.section_type || 'MCQ',
  };
}

/**
 * Insert template questions for a mock from the params list.
 * @returns {Promise<number>} total questions saved
 */
async function generateTemplateQuestions({
  examId,
  mockTestId,
  paperNumber,
  questionParams,
  existingCount = 0,
}) {
  const paramsToGenerate = questionParams.slice(existingCount);
  let inserted = 0;

  for (let i = 0; i < paramsToGenerate.length; i++) {
    const param = paramsToGenerate[i];
    const question = buildTemplateQuestion(param, existingCount + i + 1);
    const questionTypeToSave = question.question_type;

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
      question.unit,
      question.topic,
      question.sub_topic,
      question.concept_tags,
      question.difficulty,
      questionTypeToSave,
      null,
      null,
      null,
      '[]',
      question.question_text,
      JSON.stringify(question.options),
      question.correct_option,
      question.solution_text,
      question.marks,
      question.negative_marks,
      question.source,
      question.generation_prompt_version,
      question.section_name,
      normalizeSectionType(question.section_type),
      null,
    ]);

    const qId = insertResult.rows[0].id;
    const orderIndex = existingCount + i + 1;
    await db.query(`
      INSERT INTO exam_mock_questions (exam_mock_id, question_id, exam_id, order_index, paper_number)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (exam_mock_id, question_id) DO NOTHING
    `, [mockTestId, qId, examId, orderIndex, paperNumber]);
    inserted++;
  }

  return existingCount + inserted;
}

function shouldUseTemplateQuestions() {
  return String(process.env.MOCK_USE_TEMPLATE_QUESTIONS || '').toLowerCase() === 'true';
}

module.exports = { generateTemplateQuestions, shouldUseTemplateQuestions, buildTemplateQuestion };
