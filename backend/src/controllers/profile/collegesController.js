const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const ExamCareerGoal = require('../../models/exam/ExamCareerGoal');
const ExamEligibilityCriteria = require('../../models/exam/ExamEligibilityCriteria');
const CollegeRecommendedExam = require('../../models/college/CollegeRecommendedExam');
const College = require('../../models/college/College');

/**
 * Get recommended colleges for the authenticated user.
 * Uses user's recommended exam IDs (career goals + stream) and returns colleges
 * that have any of those exams in college_recommended_exams.
 * GET /api/auth/profile/recommended-colleges
 */
async function getRecommendedColleges(req, res) {
  try {
    const userId = req.user.id;

    const [academics, careerGoalsRow] = await Promise.all([
      UserAcademics.findByUserId(userId),
      UserCareerGoals.findByUserId(userId)
    ]);

    const streamId = academics?.stream_id ?? null;
    const careerGoalIds = careerGoalsRow?.interests ?? [];
    const normalizedCareerGoalIds = Array.isArray(careerGoalIds)
      ? careerGoalIds.map(id => (typeof id === 'string' ? parseInt(id, 10) : id)).filter(id => !isNaN(id))
      : [];

    if (normalizedCareerGoalIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [], message: 'Add career goals to get recommended colleges.' }
      });
    }

    const candidateExamIds = await ExamCareerGoal.getExamIdsByCareerGoalIds(normalizedCareerGoalIds);
    if (candidateExamIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] }
      });
    }

    const eligibilityRows = await ExamEligibilityCriteria.findByExamIds(candidateExamIds);
    const eligibilityByExamId = new Map(eligibilityRows.map(row => [row.exam_id, row]));

    const streamIdNum = streamId != null ? Number(streamId) : null;
    const recommendedExamIds = candidateExamIds.filter(examId => {
      const criteria = eligibilityByExamId.get(examId);
      if (!criteria) return true;
      const streamIds = criteria.stream_ids;
      if (!streamIds || !Array.isArray(streamIds) || streamIds.length === 0) return true;
      if (streamIdNum == null) return false;
      return streamIds.some(s => Number(s) === streamIdNum);
    });

    if (recommendedExamIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] }
      });
    }

    const collegeIds = await CollegeRecommendedExam.getCollegeIdsByExamIds(recommendedExamIds);
    if (collegeIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] }
      });
    }

    const colleges = await College.findByIds(collegeIds);
    res.json({
      success: true,
      data: { colleges: colleges || [] }
    });
  } catch (error) {
    console.error('Error fetching recommended colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended colleges'
    });
  }
}

module.exports = {
  getRecommendedColleges
};
