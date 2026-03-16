/**
 * Build the list of question generation params from an exam's format config.
 * Provides only structural slot info; content intelligence (topics, difficulty) comes from the Mock Prompt.
 */
const ExamMockPrompt = require('../../../models/taxonomy/ExamMockPrompt');

/**
 * Normalize a section type string to a geminiService question_type.
 * Handles both old format ("Numerical", "MCQ") and new flat format ("mcq_single", "numerical").
 */
function resolveQuestionType(rawType) {
  if (!rawType) return 'mcq_single';
  const t = String(rawType).toLowerCase().trim();
  if (t === 'numerical' || t === 'integer') return 'numerical';
  if (t === 'mcq_single' || t === 'mcq') return 'mcq_single';
  if (t === 'mcq_multiple') return 'mcq_multiple';
  if (t.includes('numerical') || t.includes('integer')) return 'numerical';
  return 'mcq_single';
}

/**
 * Resolve the format object for a specific paper from the exam's format JSONB.
 * Handles:
 *   - Flat: { name, sections: {...} } — single paper, paperNumber ignored
 *   - Nested: { "paper1": { sections: {...} }, "paper2": { sections: {...} } }
 *
 * @param {object} rawFormat - The format JSONB from exams_taxonomies
 * @param {number} paperNumber - 1-based paper number
 * @returns {object|null} The resolved format object with sections
 */
function resolveFormatForPaper(rawFormat, paperNumber = 1) {
  if (!rawFormat || typeof rawFormat !== 'object') return null;

  const isFlatFormat = rawFormat.sections && typeof rawFormat.sections === 'object';
  if (isFlatFormat) return rawFormat;

  // Nested shape: keys are format IDs like "paper1", "paper2", "default", etc.
  const keys = Object.keys(rawFormat).filter(
    (k) => rawFormat[k] && typeof rawFormat[k] === 'object' && rawFormat[k].sections
  );

  if (keys.length === 0) return null;

  // Try to match by paper number: "paper1" for paperNumber=1, "paper2" for paperNumber=2
  const paperKey = `paper${paperNumber}`;
  if (rawFormat[paperKey]?.sections) return rawFormat[paperKey];

  // Fallback: pick by index (0-based from paperNumber)
  const idx = paperNumber - 1;
  if (idx < keys.length) return rawFormat[keys[idx]];

  // Last resort: first key
  return rawFormat[keys[0]];
}

/**
 * Build params for geminiService.generateQuestion from an exam row.
 * Prefers prompt from exam_mock_prompts.
 *
 * @param {object} exam - Row from exams_taxonomies
 * @param {number} [paperNumber=1] - 1-based paper number for multi-paper exams
 * @returns {Promise<Array<object>>} Array of params for geminiService.generateQuestion
 */
async function buildQuestionParamsList(exam, paperNumber = 1) {
  const rawFormat = exam.format && typeof exam.format === 'object' ? exam.format : {};

  let generation_prompt = null;
  try {
    generation_prompt = await ExamMockPrompt.getByExamId(exam.id);
  } catch (err) {
    console.warn(`[buildParams] Could not load exam_mock_prompts for exam ${exam.id}:`, err.message);
  }
  if (!generation_prompt && exam.generation_prompt && String(exam.generation_prompt).trim()) {
    generation_prompt = exam.generation_prompt.trim();
  }

  const format = resolveFormatForPaper(rawFormat, paperNumber);

  if (!format) {
    const params = [];
    const total = 10;
    for (let i = 0; i < total; i++) {
      params.push({
        exam_name: exam.name,
        subject: 'General',
        section_name: 'General',
        section_type: 'MCQ',
        question_type: 'any',
        question_number: i + 1,
        total_in_section: total,
        marks: 4,
        negative_marks: 1,
        generation_prompt,
      });
    }
    return params;
  }

  const markingScheme = format.marking_scheme || {};
  const defaultCorrectMarks = markingScheme.correct || 4;
  const defaultNegativeMarks = Math.abs(markingScheme.incorrect != null ? markingScheme.incorrect : -1);

  const sections = format.sections || {};
  const params = [];

  for (const [sectionKey, sectionConfig] of Object.entries(sections)) {
    const sectionName = sectionConfig.name || sectionKey;
    const subsections = sectionConfig.subsections || {};

    if (Object.keys(subsections).length === 0) {
      const questionCount = sectionConfig.count || sectionConfig.questions || sectionConfig.total_questions || 5;
      const rawType = sectionConfig.type || 'MCQ';
      const sectionType = rawType;
      const questionType = resolveQuestionType(rawType);
      const marksCorrect = sectionConfig.marks_correct || defaultCorrectMarks;
      const marksIncorrect = sectionConfig.marks_incorrect != null ? sectionConfig.marks_incorrect : defaultNegativeMarks;

      for (let i = 0; i < questionCount; i++) {
        params.push({
          exam_name: exam.name,
          subject: sectionName,
          section_name: sectionKey,
          section_type: sectionType,
          question_type: questionType,
          question_number: i + 1,
          total_in_section: questionCount,
          marks: marksCorrect,
          negative_marks: Math.abs(marksIncorrect),
          generation_prompt,
        });
      }
    } else {
      for (const [subsectionKey, subsectionConfig] of Object.entries(subsections)) {
        const questionCount = subsectionConfig.count || subsectionConfig.questions || 5;
        const rawType = subsectionConfig.type || subsectionConfig.section_type || 'MCQ';
        const sectionType = rawType;
        const questionType = resolveQuestionType(rawType);
        const marksCorrect = subsectionConfig.marks_correct || defaultCorrectMarks;
        const marksIncorrect = subsectionConfig.marks_incorrect != null ? subsectionConfig.marks_incorrect : defaultNegativeMarks;

        for (let i = 0; i < questionCount; i++) {
          params.push({
            exam_name: exam.name,
            subject: sectionName,
            section_name: sectionKey,
            section_type: sectionType,
            question_type: questionType,
            question_number: i + 1,
            total_in_section: questionCount,
            marks: marksCorrect,
            negative_marks: Math.abs(marksIncorrect),
            generation_prompt,
          });
        }
      }
    }
  }

  if (params.length === 0) {
    const total = format.total_questions || 10;
    for (let i = 0; i < total; i++) {
      params.push({
        exam_name: exam.name,
        subject: 'General',
        section_name: 'General',
        section_type: 'MCQ',
        question_type: 'mcq_single',
        question_number: i + 1,
        total_in_section: total,
        marks: defaultCorrectMarks,
        negative_marks: defaultNegativeMarks,
        generation_prompt,
      });
    }
  }

  return params;
}

module.exports = { buildQuestionParamsList };
