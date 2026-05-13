const UserAcademics = require('../../models/user/UserAcademics');
const Scholarship = require('../../models/scholarship/Scholarship');
const ScholarshipExam = require('../../models/scholarship/ScholarshipExam');
const db = require('../../config/database');
const { getDashboardStreamExamContext } = require('./dashboardShortlistContext');

async function enrichScholarshipRows(scholarships) {
  if (!scholarships || scholarships.length === 0) return [];
  const ids = scholarships.map((s) => s.id).filter((id) => id != null);
  if (ids.length === 0) return [];

  const examLinkRows = await ScholarshipExam.getExamLinksForScholarshipIds(ids);
  const examMap = new Map();
  for (const row of examLinkRows) {
    const sid = row.scholarship_id;
    if (!examMap.has(sid)) examMap.set(sid, []);
    examMap.get(sid).push({
      id: row.exam_id,
      name: row.exam_name,
      code: row.exam_code,
    });
  }
  return scholarships.map((sch) => ({
    ...sch,
    linkedExams: examMap.get(sch.id) || [],
  }));
}

/**
 * GET /api/auth/profile/dashboard-scholarships
 */
async function getDashboardScholarships(req, res) {
  try {
    const userId = req.user.id;
    const ctx = await getDashboardStreamExamContext(userId);

    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          allScholarships: [],
          recommendedScholarships: [],
          shortlistedScholarships: [],
          shortlistedScholarshipIds: [],
          message: ctx.message,
        },
      });
    }

    const { allExamIds, recommendedExamIds } = ctx;
    const academics = await UserAcademics.findByUserId(userId);

    // All scholarships: rows in scholarship_exams whose exam_id is in the stream "all exams" set
    // (same IDs as dashboard Exam Shortlist → All).
    const allScholarshipIds =
      allExamIds.length > 0 ? await ScholarshipExam.getScholarshipIdsByExamIds(allExamIds) : [];
    // Recommended scholarships: same mapping table, exam_id in the scored top-20 recommended set.
    const recScholarshipIds =
      recommendedExamIds.length > 0
        ? await ScholarshipExam.getScholarshipIdsByExamIds(recommendedExamIds)
        : [];

    const shortlistedRaw = Array.isArray(academics?.user_shortlisted_scholarships)
      ? academics.user_shortlisted_scholarships
      : [];
    const shortlistedScholarshipIds = shortlistedRaw
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    const allScholarships = await enrichScholarshipRows(await Scholarship.findByIds(allScholarshipIds));
    const recommendedScholarships = await enrichScholarshipRows(await Scholarship.findByIds(recScholarshipIds));

    const shortlistedUnique = [...new Set(shortlistedScholarshipIds)];
    const shortlistedScholarships =
      shortlistedUnique.length > 0
        ? await enrichScholarshipRows(await Scholarship.findByIds(shortlistedUnique))
        : [];

    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        allScholarships,
        recommendedScholarships,
        shortlistedScholarships,
        shortlistedScholarshipIds,
        message:
          allScholarships.length === 0 && recommendedScholarships.length === 0
            ? 'No scholarships match your exam filters yet.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard scholarships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarships',
    });
  }
}

/**
 * PUT /api/auth/profile/shortlisted-scholarships
 */
async function updateShortlistedScholarships(req, res) {
  try {
    const userId = req.user.id;
    const scholarshipId = Number(req.body.scholarship_id);
    const shortlisted = Boolean(req.body.shortlisted);

    if (!Number.isInteger(scholarshipId) || scholarshipId < 1) {
      return res.status(400).json({
        success: false,
        message: 'scholarship_id must be a positive integer',
      });
    }

    const row = await Scholarship.findById(scholarshipId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const existing = await UserAcademics.findByUserId(userId);
    const current = Array.isArray(existing?.user_shortlisted_scholarships)
      ? existing.user_shortlisted_scholarships.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0)
      : [];

    const nextSet = new Set(current);
    if (shortlisted) nextSet.add(scholarshipId);
    else nextSet.delete(scholarshipId);
    const next = [...nextSet].sort((a, b) => a - b);

    const upd = await db.query(
      `UPDATE user_academics SET user_shortlisted_scholarships = $1::integer[], updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 RETURNING user_shortlisted_scholarships`,
      [next, userId]
    );

    if (upd.rowCount === 0) {
      await db.query(
        `INSERT INTO user_academics (user_id, user_shortlisted_scholarships) VALUES ($1, $2::integer[])
         ON CONFLICT (user_id) DO UPDATE SET user_shortlisted_scholarships = EXCLUDED.user_shortlisted_scholarships, updated_at = CURRENT_TIMESTAMP`,
        [userId, next]
      );
    }

    return res.json({
      success: true,
      data: { shortlistedScholarshipIds: next },
      message: shortlisted ? 'Scholarship shortlisted' : 'Scholarship removed from shortlist',
    });
  } catch (error) {
    console.error('Error updating shortlisted scholarships:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update shortlist',
    });
  }
}

module.exports = {
  getDashboardScholarships,
  updateShortlistedScholarships,
};
