import type { Exam, ExamPatternPublic } from '@/api/exams';
import type { ExamFormat } from '@/api/tests';

/**
 * exam_pattern.duration_minutes may store hours (admin) or legacy minutes — mirror backend helper.
 */
export function patternDurationToTestMinutes(stored: number | null | undefined): number | null {
  if (stored == null) return null;
  const n = Number(stored);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n <= 12) return Math.round(n * 60);
  return Math.round(n);
}

/** Build a minimal mock-test format from exam_pattern when API formats are unavailable. */
export function buildFormatFromExamPattern(exam: Exam): ExamFormat {
  const pattern: ExamPatternPublic | null | undefined = exam.examPattern;
  const questions = pattern?.number_of_questions ?? 50;
  const totalMarks = pattern?.total_marks ?? questions * 4;
  const durationMinutes = patternDurationToTestMinutes(pattern?.duration_minutes) ?? 180;
  const marksPerQ = questions > 0 ? Math.max(1, Math.round(totalMarks / questions)) : 4;

  return {
    format_id: 'default',
    name: `${exam.name} Mock Test`,
    duration_minutes: durationMinutes,
    total_marks: totalMarks,
    sections: {
      General: {
        name: 'General',
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
    marking_scheme: { correct: 4, incorrect: -1, unattempted: 0 },
    rules: [
      `Total duration: ${Math.round(durationMinutes / 60)} hour(s)`,
      `Total questions: ${questions}`,
      `Maximum marks: ${totalMarks}`,
      pattern?.negative_marking
        ? `Negative marking: ${pattern.negative_marking}`
        : 'Marking: +4 for correct, -1 for incorrect, 0 for unattempted',
      pattern?.weightage_of_subjects
        ? `Subject weightage: ${pattern.weightage_of_subjects}`
        : 'Practice mode — answer questions at your own pace',
    ],
  };
}
