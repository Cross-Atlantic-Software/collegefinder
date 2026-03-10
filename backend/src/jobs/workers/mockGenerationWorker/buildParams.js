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
  // Old shape used "Numerical" string
  if (t.includes('numerical') || t.includes('integer')) return 'numerical';
  // Fallback: any MCQ variant
  return 'mcq_single';
}

/**
 * Build params for geminiService.generateQuestion from an exam row.
 * Handles two format shapes stored in exams_taxonomies.format:
 *   - Flat: { name, total_questions, sections: { Subject: { total_questions, subsections: { ... } } } }
 *   - Nested: { "FORMAT_ID": { sections: { Subject: { subsections: { "Section A": { type, questions, ... } } } } } }
 * Prefers prompt from exam_mock_prompts.
 *
 * @param {object} exam - Row from exams_taxonomies
 * @returns {Promise<Array<object>>} Array of params for geminiService.generateQuestion
 */
async function buildQuestionParamsList(exam) {
  const rawFormat = exam.format && typeof exam.format === 'object' ? exam.format : {};

  let generation_prompt = null;
  try {
    generation_prompt = await ExamMockPrompt.getByExamId(exam.id);
  } catch (_) {}
  if (!generation_prompt && exam.generation_prompt && String(exam.generation_prompt).trim()) {
    generation_prompt = exam.generation_prompt.trim();
  }

  // Detect flat format shape: has a "sections" key directly on the format object
  const isFlatFormat = rawFormat.sections && typeof rawFormat.sections === 'object';

  // Resolve to the format object that contains { sections: { ... }, marking_scheme: { ... } }
  let format;
  if (isFlatFormat) {
    format = rawFormat;
  } else {
    // Nested shape: pick the first format id whose value has a sections object
    const firstKey = Object.keys(rawFormat).find(
      (k) => rawFormat[k] && typeof rawFormat[k] === 'object' && rawFormat[k].sections
    );
    format = firstKey ? rawFormat[firstKey] : null;
  }

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
      // Flat section with no subsections: use count or total_questions
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
        // Flat subsection uses "count"; nested uses "questions"
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
        section_type: 'mcq_single',
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
