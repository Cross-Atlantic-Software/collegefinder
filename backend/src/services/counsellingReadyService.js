/**
 * Counselling Ready — completed automation_applications with active counselling window.
 */
const ExamDates = require('../models/exam/ExamDates');
const { normalizeExamDateIso, todayIsoDate } = require('../utils/examDateUtils');
const { loadAutomationCompletedTaxonomyExamIds } = require('./journeyPhaseDatesService');

/**
 * @param {number} userId
 * @returns {{ percent: number, activeCount: number, totalCount: number, hasCounsellingDates: boolean, isReady: boolean }}
 */
async function loadCounsellingReadyProgress(userId) {
  const empty = {
    percent: 0,
    activeCount: 0,
    totalCount: 0,
    hasCounsellingDates: false,
    isReady: false,
  };

  const taxonomyIds = await loadAutomationCompletedTaxonomyExamIds(userId);
  if (taxonomyIds.length === 0) return empty;

  const datesRows = await ExamDates.findByExamIds(taxonomyIds);
  const dateMap = new Map(datesRows.map((d) => [Number(d.exam_id), d]));
  const today = todayIsoDate();

  let totalCount = 0;
  let activeCount = 0;

  for (const examId of taxonomyIds) {
    const row = dateMap.get(examId);
    const counsellingStart = normalizeExamDateIso(row?.counselling_start_date ?? row?.counselling_date);
    if (!counsellingStart) continue;

    totalCount += 1;
    if (counsellingStart <= today) {
      activeCount += 1;
    }
  }

  if (totalCount === 0) return empty;

  const percent = Math.round((activeCount / totalCount) * 100);

  return {
    percent,
    activeCount,
    totalCount,
    hasCounsellingDates: true,
    isReady: activeCount === totalCount,
  };
}

module.exports = {
  loadCounsellingReadyProgress,
};
