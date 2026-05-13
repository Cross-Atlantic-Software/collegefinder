const UserAcademics = require('../../models/user/UserAcademics');
const Institute = require('../../models/institute/Institute');
const InstituteExam = require('../../models/institute/InstituteExam');
const db = require('../../config/database');
const { getDashboardStreamExamContext } = require('./dashboardShortlistContext');

async function enrichInstituteRows(institutes) {
  if (!institutes || institutes.length === 0) return [];
  const ids = institutes.map((i) => i.id).filter((id) => id != null);
  if (ids.length === 0) return [];

  const examLinkRows = await InstituteExam.getExamLinksForInstituteIds(ids);
  const examMap = new Map();
  for (const row of examLinkRows) {
    const iid = row.institute_id;
    if (!examMap.has(iid)) examMap.set(iid, []);
    examMap.get(iid).push({
      id: row.exam_id,
      name: row.exam_name,
      code: row.exam_code,
    });
  }
  return institutes.map((inst) => ({
    ...inst,
    linkedExams: examMap.get(inst.id) || [],
  }));
}

/**
 * GET /api/auth/profile/dashboard-institutes
 */
async function getDashboardInstitutes(req, res) {
  try {
    const userId = req.user.id;
    const ctx = await getDashboardStreamExamContext(userId);

    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          allInstitutes: [],
          recommendedInstitutes: [],
          shortlistedInstitutes: [],
          shortlistedInstituteIds: [],
          message: ctx.message,
        },
      });
    }

    const { allExamIds, recommendedExamIds } = ctx;
    const academics = await UserAcademics.findByUserId(userId);

    // All coachings: institutes mapped (institute_exams + institute_exam_specialization) to at least
    // one exam in the user's stream "all exams" set (same IDs as dashboard Exam Shortlist → All).
    const allInstituteIds =
      allExamIds.length > 0 ? await InstituteExam.getInstituteIdsByExamIds(allExamIds) : [];
    // Recommended coachings: same mapping tables, but only exams in the scored top-20 recommended set.
    const recInstituteIds =
      recommendedExamIds.length > 0
        ? await InstituteExam.getInstituteIdsByExamIds(recommendedExamIds)
        : [];

    const shortlistedRaw = Array.isArray(academics?.user_shortlisted_institutes)
      ? academics.user_shortlisted_institutes
      : [];
    const shortlistedInstituteIds = shortlistedRaw
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const allInstitutes = await enrichInstituteRows(await Institute.findByIds(allInstituteIds));
    const recommendedInstitutes = await enrichInstituteRows(await Institute.findByIds(recInstituteIds));

    const shortlistedUnique = [...new Set(shortlistedInstituteIds)];
    const shortlistedInstitutes =
      shortlistedUnique.length > 0
        ? await enrichInstituteRows(await Institute.findByIds(shortlistedUnique))
        : [];

    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        allInstitutes,
        recommendedInstitutes,
        shortlistedInstitutes,
        shortlistedInstituteIds,
        message:
          allInstitutes.length === 0 && recommendedInstitutes.length === 0
            ? 'No coaching institutes match your exam filters yet.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching institutes',
    });
  }
}

/**
 * PUT /api/auth/profile/shortlisted-institutes
 */
async function updateShortlistedInstitutes(req, res) {
  try {
    const userId = req.user.id;
    const instituteId = Number(req.body.institute_id);
    const shortlisted = Boolean(req.body.shortlisted);

    if (!Number.isInteger(instituteId) || instituteId < 1) {
      return res.status(400).json({
        success: false,
        message: 'institute_id must be a positive integer',
      });
    }

    const row = await Institute.findById(instituteId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Institute not found',
      });
    }

    const existing = await UserAcademics.findByUserId(userId);
    const current = Array.isArray(existing?.user_shortlisted_institutes)
      ? existing.user_shortlisted_institutes.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    const nextSet = new Set(current);
    if (shortlisted) nextSet.add(instituteId);
    else nextSet.delete(instituteId);
    const next = [...nextSet].sort((a, b) => a - b);

    const upd = await db.query(
      `UPDATE user_academics SET user_shortlisted_institutes = $1::integer[], updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_shortlisted_institutes`,
      [next, userId]
    );

    if (upd.rowCount === 0) {
      await db.query(
        `INSERT INTO user_academics (user_id, user_shortlisted_institutes) VALUES ($1, $2::integer[])
         ON CONFLICT (user_id) DO UPDATE SET user_shortlisted_institutes = EXCLUDED.user_shortlisted_institutes, updated_at = CURRENT_TIMESTAMP`,
        [userId, next]
      );
    }

    return res.json({
      success: true,
      data: { shortlistedInstituteIds: next },
      message: shortlisted ? 'Institute shortlisted' : 'Institute removed from shortlist',
    });
  } catch (error) {
    console.error('Error updating shortlisted institutes:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shortlist',
    });
  }
}

module.exports = {
  getDashboardInstitutes,
  updateShortlistedInstitutes,
};
