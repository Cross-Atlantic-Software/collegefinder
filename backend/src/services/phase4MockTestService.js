/**
 * Phase 4 mock test reminders — 7-day intervals for 3 months before exam_date.
 * Exams: recommended + shortlisted (same pool as journey phases 1–2).
 */
const ExamDates = require('../models/exam/ExamDates');
const {
  normalizeExamDateIso,
  addDaysToIsoDate,
  todayIsoDate,
} = require('../utils/examDateUtils');

const MOCK_TEST_INTERVAL_DAYS = 7;
const MOCK_TEST_WINDOW_DAYS = 90;

/** Reminder dates every 7 days from (exam_date - 7) back to 3 months before exam. */
function generateMockTestDatesBeforeExam(examDateRaw) {
  const examDate = normalizeExamDateIso(examDateRaw);
  if (!examDate) return [];

  const windowStart = addDaysToIsoDate(examDate, -MOCK_TEST_WINDOW_DAYS);
  if (!windowStart) return [];

  const dates = [];
  let cursor = addDaysToIsoDate(examDate, -MOCK_TEST_INTERVAL_DAYS);

  while (cursor && cursor >= windowStart) {
    dates.push(cursor);
    cursor = addDaysToIsoDate(cursor, -MOCK_TEST_INTERVAL_DAYS);
  }

  return dates.sort((a, b) => a.localeCompare(b));
}

/**
 * @param {object} ctx from loadDashboardExamShortlistContext
 * @returns {{ reminders: Array, completedInWindow: number, totalInWindow: number }}
 */
async function loadPhase4MockTestReminders(ctx) {
  const empty = { reminders: [], completedInWindow: 0, totalInWindow: 0 };
  const today = todayIsoDate();

  const idSet = new Set([
    ...(ctx.recommendedExamIds || []),
    ...(ctx.shortlistedExamIds || []),
  ]);
  if (idSet.size === 0) return empty;

  const examById = new Map(ctx.streamExams.map((e) => [Number(e.id), e]));
  const ids = [...idSet].filter((id) => examById.has(id));
  if (ids.length === 0) return empty;

  const recommendedSet = new Set((ctx.recommendedExamIds || []).map(Number));
  const datesRows = await ExamDates.findByExamIds(ids);
  const dateMap = new Map(datesRows.map((d) => [Number(d.exam_id), d]));

  /** @type {Map<string, { examId: number, examName: string, examDate: string, priority: number }>} */
  const slotByDate = new Map();

  for (const id of ids) {
    const examDateRaw = dateMap.get(id)?.exam_date;
    const examDate = normalizeExamDateIso(examDateRaw);
    if (!examDate) continue;

    const exam = examById.get(id);
    const examName = exam?.name || `Exam ${id}`;
    const priority = recommendedSet.has(id) ? 0 : 1;

    for (const mockTestDate of generateMockTestDatesBeforeExam(examDate)) {
      const existing = slotByDate.get(mockTestDate);
      if (!existing || priority < existing.priority) {
        slotByDate.set(mockTestDate, { examId: id, examName, examDate, priority });
      }
    }
  }

  if (slotByDate.size === 0) return empty;

  let completedInWindow = 0;
  const reminders = [];

  for (const [mockTestDate, slot] of [...slotByDate.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    if (mockTestDate < today) {
      completedInWindow += 1;
      continue;
    }
    reminders.push({
      examId: slot.examId,
      examName: slot.examName,
      examDate: slot.examDate,
      mockTestDate,
    });
  }

  return {
    reminders,
    completedInWindow,
    totalInWindow: slotByDate.size,
  };
}

module.exports = {
  MOCK_TEST_INTERVAL_DAYS,
  MOCK_TEST_WINDOW_DAYS,
  generateMockTestDatesBeforeExam,
  loadPhase4MockTestReminders,
};
