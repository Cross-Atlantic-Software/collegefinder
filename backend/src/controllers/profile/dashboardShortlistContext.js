const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const Exam = require('../../models/taxonomy/Exam');
const StreamInterestRecommendation = require('../../models/mapping/StreamInterestRecommendation');
const { computeRecommendedExamIdsTop20 } = require('../../services/examDashboardRecommendation');

/**
 * Stream + exam ID sets used by dashboard college / institute / scholarship shortlist tabs.
 * Mirrors logic in collegesController.getDashboardColleges.
 */
async function getDashboardStreamExamContext(userId) {
  const [academics, careerGoalsRow] = await Promise.all([
    UserAcademics.findByUserId(userId),
    UserCareerGoals.findByUserId(userId),
  ]);

  const streamId = academics?.stream_id ?? null;
  if (streamId == null || streamId === '') {
    return {
      streamId: null,
      allExamIds: [],
      recommendedExamIds: [],
      message: 'Select your stream in profile to view matches.',
    };
  }

  const streamExams = await Exam.findAllByStreamId(streamId);
  const allExamIds = streamExams.map((e) => Number(e.id));

  const careerGoalIds = careerGoalsRow?.interests ?? [];
  const normalizedCareerGoalIds = Array.isArray(careerGoalIds)
    ? careerGoalIds
        .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
        .filter((id) => Number.isInteger(id))
    : [];

  const streamMappings = await StreamInterestRecommendation.findByStream(Number(streamId));
  const recommendedExamIds = computeRecommendedExamIdsTop20(
    streamExams,
    normalizedCareerGoalIds,
    streamMappings
  );

  return {
    streamId: Number(streamId),
    /** Stream-filtered exam IDs (dashboard "All exams" pool). */
    allExamIds,
    /** Top-20 scored recommended exam IDs (dashboard "Recommended exams" pool). */
    recommendedExamIds,
    message: undefined,
  };
}

module.exports = { getDashboardStreamExamContext };
