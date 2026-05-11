const UserAcademics = require('../../models/user/UserAcademics');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
const ExamCareerGoal = require('../../models/exam/ExamCareerGoal');
const ExamEligibilityCriteria = require('../../models/exam/ExamEligibilityCriteria');
const CollegeRecommendedExam = require('../../models/college/CollegeRecommendedExam');
const College = require('../../models/college/College');
const Exam = require('../../models/taxonomy/Exam');
const StreamInterestRecommendation = require('../../models/mapping/StreamInterestRecommendation');
const CollegeDetails = require('../../models/college/CollegeDetails');
const CollegeKeyDates = require('../../models/college/CollegeKeyDates');
const CollegeDocumentsRequired = require('../../models/college/CollegeDocumentsRequired');
const CollegeCounsellingProcess = require('../../models/college/CollegeCounsellingProcess');
const CollegeProgram = require('../../models/college/CollegeProgram');
const db = require('../../config/database');

function groupByCollegeId(rows, key = 'college_id') {
  const m = new Map();
  for (const row of rows) {
    const cid = row[key];
    if (!m.has(cid)) m.set(cid, []);
    m.get(cid).push(row);
  }
  return m;
}

/**
 * Attach admin-linked college rows for dashboard/API consumers.
 */
async function enrichCollegeRows(colleges) {
  if (!colleges || colleges.length === 0) return [];
  const ids = colleges.map((c) => c.id).filter((id) => id != null);
  if (ids.length === 0) return [];

  const [
    detailRows,
    keyDateRows,
    docRows,
    counsellingRows,
    programRows,
    examLinkRows,
  ] = await Promise.all([
    CollegeDetails.findByCollegeIds(ids),
    CollegeKeyDates.findByCollegeIds(ids),
    CollegeDocumentsRequired.findByCollegeIds(ids),
    CollegeCounsellingProcess.findByCollegeIds(ids),
    CollegeProgram.findByCollegeIdsWithProgramNames(ids),
    CollegeRecommendedExam.getExamLinksForCollegeIds(ids),
  ]);

  const detailMap = new Map(detailRows.map((r) => [r.college_id, r]));
  const keyDatesMap = groupByCollegeId(keyDateRows);
  const docsMap = groupByCollegeId(docRows);
  const counsellingMap = groupByCollegeId(counsellingRows);
  const programsMap = groupByCollegeId(programRows);
  const examLinksMap = groupByCollegeId(examLinkRows);

  return colleges.map((c) => {
    const examRows = examLinksMap.get(c.id) || [];
    const linkedExams = examRows.map((r) => ({
      id: r.exam_id,
      name: r.exam_name,
      code: r.exam_code,
    }));
    return {
      ...c,
      collegeDetails: detailMap.get(c.id) || null,
      keyDates: keyDatesMap.get(c.id) || [],
      documentsRequired: docsMap.get(c.id) || [],
      counsellingSteps: counsellingMap.get(c.id) || [],
      programs: programsMap.get(c.id) || [],
      linkedExams,
    };
  });
}

/**
 * Legacy: recommended colleges via career-goal exam mapping (kept for other callers).
 * GET /api/auth/profile/recommended-colleges
 */
async function getRecommendedColleges(req, res) {
  try {
    const userId = req.user.id;

    const [academics, careerGoalsRow] = await Promise.all([
      UserAcademics.findByUserId(userId),
      UserCareerGoals.findByUserId(userId),
    ]);

    const streamId = academics?.stream_id ?? null;
    const careerGoalIds = careerGoalsRow?.interests ?? [];
    const normalizedCareerGoalIds = Array.isArray(careerGoalIds)
      ? careerGoalIds.map((id) => (typeof id === 'string' ? parseInt(id, 10) : id)).filter((id) => !isNaN(id))
      : [];

    if (normalizedCareerGoalIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [], message: 'Add interests to get recommended colleges.' },
      });
    }

    const candidateExamIds = await ExamCareerGoal.getExamIdsByCareerGoalIds(normalizedCareerGoalIds);
    if (candidateExamIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] },
      });
    }

    const eligibilityRows = await ExamEligibilityCriteria.findByExamIds(candidateExamIds);
    const eligibilityByExamId = new Map(eligibilityRows.map((row) => [row.exam_id, row]));

    const streamIdNum = streamId != null ? Number(streamId) : null;
    const recommendedExamIds = candidateExamIds.filter((examId) => {
      const criteria = eligibilityByExamId.get(examId);
      if (!criteria) return true;
      const streamIds = criteria.stream_ids;
      if (!streamIds || !Array.isArray(streamIds) || streamIds.length === 0) return true;
      if (streamIdNum == null) return false;
      return streamIds.some((s) => Number(s) === streamIdNum);
    });

    if (recommendedExamIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] },
      });
    }

    const collegeIds = await CollegeRecommendedExam.getCollegeIdsByExamIds(recommendedExamIds);
    if (collegeIds.length === 0) {
      return res.json({
        success: true,
        data: { colleges: [] },
      });
    }

    const colleges = await College.findByIds(collegeIds);
    res.json({
      success: true,
      data: { colleges: colleges || [] },
    });
  } catch (error) {
    console.error('Error fetching recommended colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recommended colleges',
    });
  }
}

/**
 * Dashboard college shortlist — aligned with exam shortlist tabs:
 * - allColleges: colleges tagged with any exam from stream "all exams"
 * - recommendedColleges: colleges tagged with any exam from "recommended exams"
 * - shortlistedCollegeIds / shortlistedColleges: user_shortlisted_colleges
 * GET /api/auth/profile/dashboard-colleges
 */
async function getDashboardColleges(req, res) {
  try {
    const userId = req.user.id;

    const [academics, careerGoalsRow] = await Promise.all([
      UserAcademics.findByUserId(userId),
      UserCareerGoals.findByUserId(userId),
    ]);

    const streamId = academics?.stream_id ?? null;
    if (streamId == null || streamId === '') {
      return res.json({
        success: true,
        data: {
          streamId: null,
          allColleges: [],
          recommendedColleges: [],
          shortlistedColleges: [],
          shortlistedCollegeIds: [],
          message: 'Select your stream in profile to view colleges.',
        },
      });
    }

    const streamExams = await Exam.findAllByStreamId(streamId);
    const allExamIds = streamExams.map((e) => Number(e.id));
    const allExamIdSet = new Set(allExamIds);

    const careerGoalIds = careerGoalsRow?.interests ?? [];
    const normalizedCareerGoalIds = Array.isArray(careerGoalIds)
      ? careerGoalIds
          .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
          .filter((id) => Number.isInteger(id))
      : [];

    const recommendedIdSet = new Set();
    for (const interestId of normalizedCareerGoalIds) {
      const row = await StreamInterestRecommendation.findByStreamAndInterest(Number(streamId), interestId);
      if (row && Array.isArray(row.exam_ids)) {
        row.exam_ids.forEach((eid) => {
          const n = Number(eid);
          if (Number.isInteger(n) && allExamIdSet.has(n)) recommendedIdSet.add(n);
        });
      }
    }
    const recommendedExamIds = [...recommendedIdSet];

    const allCollegeIds =
      allExamIds.length > 0 ? await CollegeRecommendedExam.getCollegeIdsByExamIds(allExamIds) : [];
    const recCollegeIds =
      recommendedExamIds.length > 0
        ? await CollegeRecommendedExam.getCollegeIdsByExamIds(recommendedExamIds)
        : [];

    const shortlistedRaw = Array.isArray(academics?.user_shortlisted_colleges)
      ? academics.user_shortlisted_colleges
      : [];
    const shortlistedCollegeIds = shortlistedRaw
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const allColleges = await enrichCollegeRows(await College.findByIds(allCollegeIds));
    const recommendedColleges = await enrichCollegeRows(await College.findByIds(recCollegeIds));

    const shortlistedUnique = [...new Set(shortlistedCollegeIds)];
    const shortlistedColleges =
      shortlistedUnique.length > 0
        ? await enrichCollegeRows(await College.findByIds(shortlistedUnique))
        : [];

    return res.json({
      success: true,
      data: {
        streamId: Number(streamId),
        allColleges,
        recommendedColleges,
        shortlistedColleges,
        shortlistedCollegeIds,
        message:
          allColleges.length === 0 && recommendedColleges.length === 0
            ? 'No colleges match your exam filters yet. Tag exams on colleges in admin or widen mappings.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard colleges',
    });
  }
}

/**
 * Toggle shortlisted college IDs in user_academics.user_shortlisted_colleges
 * PUT /api/auth/profile/shortlisted-colleges
 */
async function updateShortlistedColleges(req, res) {
  try {
    const userId = req.user.id;
    const collegeId = Number(req.body.college_id);
    const shortlisted = Boolean(req.body.shortlisted);

    if (!Number.isInteger(collegeId) || collegeId < 1) {
      return res.status(400).json({
        success: false,
        message: 'college_id must be a positive integer',
      });
    }

    const college = await College.findById(collegeId);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    const existing = await UserAcademics.findByUserId(userId);
    const current = Array.isArray(existing?.user_shortlisted_colleges)
      ? existing.user_shortlisted_colleges.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    const nextSet = new Set(current);
    if (shortlisted) nextSet.add(collegeId);
    else nextSet.delete(collegeId);
    const next = [...nextSet].sort((a, b) => a - b);

    const upd = await db.query(
      `UPDATE user_academics SET user_shortlisted_colleges = $1::integer[], updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_shortlisted_colleges`,
      [next, userId]
    );

    if (upd.rowCount === 0) {
      await db.query(
        `INSERT INTO user_academics (user_id, user_shortlisted_colleges) VALUES ($1, $2::integer[])
         ON CONFLICT (user_id) DO UPDATE SET user_shortlisted_colleges = EXCLUDED.user_shortlisted_colleges, updated_at = CURRENT_TIMESTAMP`,
        [userId, next]
      );
    }

    return res.json({
      success: true,
      data: { shortlistedCollegeIds: next },
      message: shortlisted ? 'College shortlisted' : 'College removed from shortlist',
    });
  } catch (error) {
    console.error('Error updating shortlisted colleges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shortlisted colleges',
    });
  }
}

module.exports = {
  getRecommendedColleges,
  getDashboardColleges,
  updateShortlistedColleges,
};
