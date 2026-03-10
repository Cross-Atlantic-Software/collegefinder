/**
 * Build the list of question generation params from an exam's format config.
 * Provides only structural slot info; content intelligence (topics, difficulty) comes from the Mock Prompt.
 */
const ExamMockPrompt = require('../../../models/taxonomy/ExamMockPrompt');

/**
 * Build params for geminiService.generateQuestion from an exam row.
 * Uses first format; falls back to generic set if no format. Prefers prompt from exam_mock_prompts.
 *
 * @param {object} exam - Row from exams_taxonomies
 * @returns {Promise<Array<object>>} Array of params for geminiService.generateQuestion
 */
async function buildQuestionParamsList(exam) {
  const formatConfig = exam.format && typeof exam.format === 'object' ? exam.format : {};
  const formatKeys = Object.keys(formatConfig);

  let generation_prompt = null;
  try {
    generation_prompt = await ExamMockPrompt.getByExamId(exam.id);
  } catch (_) {}
  if (!generation_prompt && exam.generation_prompt && String(exam.generation_prompt).trim()) {
    generation_prompt = exam.generation_prompt.trim();
  }

  if (formatKeys.length === 0) {
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

  const firstFormatId = formatKeys[0];
  const format = formatConfig[firstFormatId];
  const sections = format.sections || {};
  const params = [];

  for (const [sectionKey, sectionConfig] of Object.entries(sections)) {
    const sectionName = sectionConfig.name || sectionKey;
    const subsections = sectionConfig.subsections || {};

    if (Object.keys(subsections).length === 0) {
      const questionCount = sectionConfig.questions || 5;
      const sectionType = sectionConfig.type || 'MCQ';
      const marksCorrect = sectionConfig.marks_correct || 4;
      const marksIncorrect = sectionConfig.marks_incorrect != null ? sectionConfig.marks_incorrect : -1;

      for (let i = 0; i < questionCount; i++) {
        const questionType = sectionType === 'Numerical' ? 'numerical' : 'any';
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
        const questionCount = subsectionConfig.questions || 5;
        const sectionType = subsectionConfig.type || subsectionConfig.section_type || 'MCQ';
        const marksCorrect = subsectionConfig.marks_correct || 4;
        const marksIncorrect = subsectionConfig.marks_incorrect != null ? subsectionConfig.marks_incorrect : -1;

        for (let i = 0; i < questionCount; i++) {
          const questionType = sectionType === 'Numerical' ? 'numerical' : 'any';
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
  }

  return params;
}

module.exports = { buildQuestionParamsList };
