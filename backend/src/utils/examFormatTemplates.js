/**
 * Exam mock-test format templates (sections, rules, marking).
 * Source of truth after exams_taxonomies.format was removed — keyed by exam code,
 * with exam_pattern row overrides for duration / totals when present.
 */
const Exam = require('../models/taxonomy/Exam');
const ExamPattern = require('../models/exam/ExamPattern');

/** Stored exam_pattern.duration_minutes may be hours (admin) or legacy minutes. */
function patternDurationToTestMinutes(stored) {
  if (stored == null || stored === '') return null;
  const n = Number(stored);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 12) return Math.round(n * 60);
  return Math.round(n);
}

function defaultMarkingScheme() {
  return { correct: 4, incorrect: -1, unattempted: 0 };
}

function buildSinglePaperFormat(config) {
  const durationMinutes = config.duration_minutes ?? 180;
  const markingScheme = config.marking_scheme || defaultMarkingScheme();
  const marksPerQuestion = markingScheme.correct ?? 4;
  const sections = config.sections || {};
  const sectionsWithMeta = {};

  for (const [key, sectionConfig] of Object.entries(sections)) {
    const subsections = sectionConfig.subsections || {};
    const subsectionsWithMeta = {};
    let sectionMarks = 0;

    for (const [subKey, subConfig] of Object.entries(subsections)) {
      const count = subConfig.count ?? subConfig.questions ?? 0;
      subsectionsWithMeta[subKey] = {
        ...subConfig,
        type: subConfig.type || 'mcq_single',
        questions: subConfig.questions ?? count,
        marks_per_question: subConfig.marks_per_question ?? marksPerQuestion,
      };
      sectionMarks +=
        (subConfig.questions ?? count) * (subConfig.marks_per_question ?? marksPerQuestion);
    }

    if (Object.keys(subsectionsWithMeta).length === 0) {
      const count =
        sectionConfig.count ??
        sectionConfig.questions ??
        sectionConfig.total_questions ??
        0;
      subsectionsWithMeta['Section A'] = {
        type: sectionConfig.type || 'mcq_single',
        questions: count,
        marks_per_question: marksPerQuestion,
      };
      sectionMarks = count * marksPerQuestion;
    }

    sectionsWithMeta[key] = {
      ...sectionConfig,
      name: sectionConfig.name || key,
      marks: sectionConfig.marks ?? sectionMarks,
      subsections: subsectionsWithMeta,
    };
  }

  return {
    name: config.name,
    duration_minutes: durationMinutes,
    total_questions: config.total_questions,
    total_marks: config.total_marks,
    marking_scheme: markingScheme,
    rules: config.rules || [],
    sections: sectionsWithMeta,
  };
}

function buildJeeMainFormat() {
  return {
    default: buildSinglePaperFormat({
      name: 'JEE Main 2024',
      duration_minutes: 180,
      total_questions: 90,
      total_marks: 300,
      marking_scheme: defaultMarkingScheme(),
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Total questions: 90 (75 MCQs + 15 Numerical)',
        'Maximum marks: 300',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'Section A (MCQ): Choose one correct option',
        'Section B (Numerical): Answer must be a number between 0-9999',
      ],
      sections: {
        Physics: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
        Chemistry: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
        Mathematics: {
          total_questions: 30,
          subsections: {
            'Section A': { type: 'mcq_single', count: 20, required: 20 },
            'Section B': { type: 'numerical', count: 10, required: 5 },
          },
        },
      },
    }),
  };
}

function buildJeeAdvancedFormat() {
  const paperConfig = {
    duration_minutes: 180,
    total_questions: 54,
    total_marks: 264,
    marking_scheme: defaultMarkingScheme(),
    rules: [
      'Total duration: 3 hours per paper',
      'Total questions: 54 per paper',
      'Maximum marks: 264 per paper',
      'Marking varies by question type',
      'Negative marking applicable',
      'Partial marking in some questions',
    ],
    sections: {
      Physics: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
      Chemistry: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
      Mathematics: {
        total_questions: 18,
        subsections: {
          'Section 1': { type: 'mcq_single', count: 6, required: 6 },
          'Section 2': { type: 'mcq_multiple', count: 6, required: 6 },
          'Section 3': { type: 'numerical', count: 6, required: 6 },
        },
      },
    },
  };

  return {
    paper1: buildSinglePaperFormat({ ...paperConfig, name: 'JEE Advanced Paper 1' }),
    paper2: buildSinglePaperFormat({ ...paperConfig, name: 'JEE Advanced Paper 2' }),
  };
}

function buildNeetFormat() {
  return {
    default: buildSinglePaperFormat({
      name: 'NEET 2024',
      duration_minutes: 180,
      total_questions: 200,
      total_marks: 720,
      marking_scheme: defaultMarkingScheme(),
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Total questions: 200 (180 to be attempted)',
        'Maximum marks: 720',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'All questions are multiple choice with single correct answer',
        'Pen and paper based exam',
      ],
      sections: {
        Physics: {
          total_questions: 50,
          subsections: {
            'Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
        Chemistry: {
          total_questions: 50,
          subsections: {
            'Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
        Biology: {
          total_questions: 100,
          subsections: {
            'Botany - Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Botany - Section B': { type: 'mcq_single', count: 15, required: 10 },
            'Zoology - Section A': { type: 'mcq_single', count: 35, required: 35 },
            'Zoology - Section B': { type: 'mcq_single', count: 15, required: 10 },
          },
        },
      },
    }),
  };
}

function buildCuetFormat() {
  return {
    default: buildSinglePaperFormat({
      name: 'CUET (UG)',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: defaultMarkingScheme(),
      rules: [
        'Total duration: 3 hours (180 minutes)',
        'Section I - General Test: 50 questions',
        'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        'Multiple choice - choose one correct option',
      ],
      sections: {
        'Section I - General Test': {
          name: 'Section I - General Test',
          total_questions: 50,
          marks: 200,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions: 50,
              marks_per_question: 4,
              required: 50,
            },
          },
        },
      },
    }),
  };
}

function buildNataFormat() {
  return {
    default: buildSinglePaperFormat({
      name: 'NATA',
      duration_minutes: 180,
      total_questions: 50,
      total_marks: 200,
      marking_scheme: defaultMarkingScheme(),
      rules: [
        'National Aptitude Test in Architecture — aptitude for B.Arch programmes per Council of Architecture norms.',
        'Assesses cognitive skills, visual perception, aesthetic sensitivity, logical reasoning, and critical thinking.',
        'Actual pattern (sessions, drawing component, marking) is defined in the official brochure each year.',
      ],
      sections: {
        'Aptitude (representative MCQ block)': {
          name: 'Aptitude (representative MCQ block)',
          total_questions: 50,
          marks: 200,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions: 50,
              marks_per_question: 4,
              required: 50,
            },
          },
        },
      },
    }),
  };
}

const TEMPLATE_BUILDERS = {
  JEE_MAIN: buildJeeMainFormat,
  JEE_ADVANCED: buildJeeAdvancedFormat,
  NEET: buildNeetFormat,
  CUET: buildCuetFormat,
  NATA: buildNataFormat,
};

function buildFormatFromPatternOnly(exam, pattern) {
  const questions = pattern?.number_of_questions ?? 50;
  const totalMarks = pattern?.total_marks ?? questions * 4;
  const durationMinutes = patternDurationToTestMinutes(pattern?.duration_minutes) ?? 180;
  const marksPerQ = questions > 0 ? Math.max(1, Math.round(totalMarks / questions)) : 4;

  return {
    default: buildSinglePaperFormat({
      name: `${exam.name} Mock Test`,
      duration_minutes: durationMinutes,
      total_questions: questions,
      total_marks: totalMarks,
      marking_scheme: defaultMarkingScheme(),
      rules: [
        `Total duration: ${Math.round(durationMinutes / 60)} hour(s)`,
        `Total questions: ${questions}`,
        `Maximum marks: ${totalMarks}`,
        pattern?.negative_marking
          ? `Negative marking: ${pattern.negative_marking}`
          : 'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
        pattern?.weightage_of_subjects
          ? `Subject weightage: ${pattern.weightage_of_subjects}`
          : 'Answer all questions at your own pace in this practice mock.',
      ],
      sections: {
        General: {
          name: 'General',
          total_questions: questions,
          marks: totalMarks,
          subsections: {
            'Section A': {
              type: 'mcq_single',
              questions,
              marks_per_question: marksPerQ,
            },
          },
        },
      },
    }),
  };
}

function applyPatternOverrides(formats, exam, pattern) {
  if (!pattern) return formats;

  const durationMinutes = patternDurationToTestMinutes(pattern.duration_minutes);
  const totalQuestions = pattern.number_of_questions;
  const totalMarks = pattern.total_marks;

  for (const key of Object.keys(formats)) {
    const fmt = formats[key];
    if (!fmt || typeof fmt !== 'object') continue;
    if (durationMinutes != null) fmt.duration_minutes = durationMinutes;
    if (totalQuestions != null) fmt.total_questions = totalQuestions;
    if (totalMarks != null) fmt.total_marks = totalMarks;
    if (pattern.negative_marking && String(pattern.negative_marking).trim()) {
      fmt.rules = [
        ...(fmt.rules || []).filter((r) => !String(r).toLowerCase().includes('negative marking')),
        `Negative marking: ${String(pattern.negative_marking).trim()}`,
      ];
    }
  }

  return formats;
}

function resolveFormatsFromExamAndPattern(exam, pattern) {
  if (!exam) return null;

  const code = exam.code ? String(exam.code).trim().toUpperCase() : '';
  const builder = code && TEMPLATE_BUILDERS[code];
  let formats = builder ? builder() : buildFormatFromPatternOnly(exam, pattern);

  if (builder && pattern) {
    formats = applyPatternOverrides(formats, exam, pattern);
  }

  return formats;
}

async function getFormatsForExam(examId) {
  const exam = await Exam.findById(examId);
  if (!exam) return null;
  const pattern = await ExamPattern.findByExamId(examId);
  return resolveFormatsFromExamAndPattern(exam, pattern);
}

function resolveFormatConfig(exam, pattern, formatId) {
  const formats = resolveFormatsFromExamAndPattern(exam, pattern);
  if (!formats) return null;

  if (formatId && formats[formatId]) return formats[formatId];

  if (formats.default) return formats.default;

  const keys = Object.keys(formats).filter(
    (k) => formats[k] && typeof formats[k] === 'object' && formats[k].sections
  );
  return keys.length > 0 ? formats[keys[0]] : null;
}

function resolveRawFormatForExam(exam, pattern) {
  return resolveFormatsFromExamAndPattern(exam, pattern);
}

module.exports = {
  patternDurationToTestMinutes,
  getFormatsForExam,
  resolveFormatConfig,
  resolveRawFormatForExam,
  resolveFormatsFromExamAndPattern,
};
