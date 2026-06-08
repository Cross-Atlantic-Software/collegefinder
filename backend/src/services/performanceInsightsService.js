/**
 * Performance Insights — Phase 4 warm-up weekly mock adherence (per exam, any mock counts).
 */
const ExamDates = require('../models/exam/ExamDates');
const TestAttempt = require('../models/test/TestAttempt');
const {
  normalizeExamDateIso,
  todayIsoDate,
  weekStartIsoFromIsoDate,
} = require('../utils/examDateUtils');
const { generateMockTestDatesBeforeExam } = require('./phase4MockTestService');

/**
 * @param {object} ctx from loadDashboardExamShortlistContext
 * @param {number} userId
 * @returns {{ percent: number, satisfiedWeeks: number, dueWeeks: number, hasDueWeeks: boolean }}
 */
async function loadPerformanceInsightsProgress(userId, ctx) {
  const empty = { percent: 0, satisfiedWeeks: 0, dueWeeks: 0, hasDueWeeks: false };
  const today = todayIsoDate();

  const idSet = new Set([
    ...(ctx.recommendedExamIds || []),
    ...(ctx.shortlistedExamIds || []),
  ]);
  if (idSet.size === 0) return empty;

  const examById = new Map(ctx.streamExams.map((e) => [Number(e.id), e]));
  const ids = [...idSet].filter((id) => examById.has(id));
  if (ids.length === 0) return empty;

  const datesRows = await ExamDates.findByExamIds(ids);
  const dateMap = new Map(datesRows.map((d) => [Number(d.exam_id), d]));

  /** Per-exam past weekly slots (each slot = one due week). */
  const dueWeekStarts = [];

  for (const examId of ids) {
    const examDate = normalizeExamDateIso(dateMap.get(examId)?.exam_date);
    if (!examDate) continue;

    for (const mockTestDate of generateMockTestDatesBeforeExam(examDate)) {
      if (mockTestDate >= today) continue;
      const weekStart = weekStartIsoFromIsoDate(mockTestDate);
      if (!weekStart) continue;
      dueWeekStarts.push({ examId, weekStart });
    }
  }

  if (dueWeekStarts.length === 0) return empty;

  const mockWeekStarts = await TestAttempt.getCompletedMockWeekStarts(userId);
  let satisfiedWeeks = 0;

  for (const slot of dueWeekStarts) {
    if (mockWeekStarts.has(slot.weekStart)) {
      satisfiedWeeks += 1;
    }
  }

  const dueWeeks = dueWeekStarts.length;
  const percent =
    dueWeeks > 0 ? Math.round((satisfiedWeeks / dueWeeks) * 100) : 0;

  return {
    percent,
    satisfiedWeeks,
    dueWeeks,
    hasDueWeeks: true,
  };
}

module.exports = {
  loadPerformanceInsightsProgress,
};
