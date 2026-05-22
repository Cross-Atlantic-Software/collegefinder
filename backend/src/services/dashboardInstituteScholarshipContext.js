const db = require('../config/database');
const UserAcademics = require('../models/user/UserAcademics');
const UserAddress = require('../models/user/UserAddress');
const InstituteExam = require('../models/institute/InstituteExam');
const ScholarshipExam = require('../models/scholarship/ScholarshipExam');
const ScholarshipCollege = require('../models/scholarship/ScholarshipCollege');
const CollegeRecommendedExam = require('../models/college/CollegeRecommendedExam');

function loadDashboardExamShortlistContext(userId) {
  const { loadDashboardExamShortlistContext: loadCtx } = require('../controllers/profile/examsController');
  if (typeof loadCtx !== 'function') {
    throw new Error('loadDashboardExamShortlistContext is not available');
  }
  return loadCtx(userId);
}

/** Exam IDs the user has form-filled (extension fill_reports), limited to stream pool. */
async function getFormFilledExamIdsForUser(userId, eligibleExamIdSet) {
  if (!eligibleExamIdSet?.size) return [];
  try {
    const result = await db.query(
      `SELECT DISTINCT exam_id
       FROM fill_reports
       WHERE user_id = $1 AND COALESCE(filled_count, 0) > 0 AND exam_id IS NOT NULL`,
      [userId]
    );
    const ids = [];
    for (const row of result.rows) {
      const n = parseInt(String(row.exam_id).trim(), 10);
      if (Number.isInteger(n) && n > 0 && eligibleExamIdSet.has(n)) {
        ids.push(n);
      }
    }
    return [...new Set(ids)];
  } catch {
    return [];
  }
}

/**
 * Exam IDs used to fetch coaching institutes (cases 1–3 in product spec).
 */
function resolvePoolExamIdsForInstitutes(ctx) {
  const { formFilledExamIds, shortlistedExamIds, recommendedExamIds } = ctx;
  if (formFilledExamIds.length > 0) {
    return [
      ...new Set(
        [...formFilledExamIds, ...shortlistedExamIds, ...recommendedExamIds]
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];
  }
  if (shortlistedExamIds.length > 0) {
    return [
      ...new Set(
        [...shortlistedExamIds, ...recommendedExamIds]
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];
  }
  return recommendedExamIds
    .map(Number)
    .filter((id) => Number.isInteger(id) && id > 0);
}

async function loadDashboardInstituteContext(userId) {
  const examCtx = await loadDashboardExamShortlistContext(userId);
  const [academics, address] = await Promise.all([
    UserAcademics.findByUserId(userId),
    UserAddress.findByUserId(userId),
  ]);

  const allExamIds = (examCtx.streamExams || [])
    .map((e) => Number(e.id))
    .filter((id) => Number.isInteger(id) && id > 0);
  const allExamIdSet = new Set(allExamIds);

  const formFilledExamIds = await getFormFilledExamIdsForUser(userId, allExamIdSet);
  const recommendedExamIds = examCtx.recommendedExamIds || [];
  const shortlistedExamIds = examCtx.shortlistedExamIds || [];
  const poolExamIds = resolvePoolExamIdsForInstitutes({
    formFilledExamIds,
    shortlistedExamIds,
    recommendedExamIds,
  });

  const shortlistedInstituteIds = [
    ...new Set(
      (Array.isArray(academics?.user_shortlisted_institutes)
        ? academics.user_shortlisted_institutes
        : []
      )
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  return {
    streamId: examCtx.streamId,
    message: examCtx.message,
    allExamIds,
    poolExamIds,
    formFilledExamIds,
    recommendedExamIds,
    shortlistedExamIds,
    shortlistedInstituteIds,
    userCity: address?.city_town_village?.trim() || null,
  };
}

async function loadDashboardScholarshipContext(userId) {
  const examCtx = await loadDashboardExamShortlistContext(userId);
  const [academics, address] = await Promise.all([
    UserAcademics.findByUserId(userId),
    UserAddress.findByUserId(userId),
  ]);

  const allExamIds = (examCtx.streamExams || [])
    .map((e) => Number(e.id))
    .filter((id) => Number.isInteger(id) && id > 0);

  const allCollegeIds =
    allExamIds.length > 0
      ? await CollegeRecommendedExam.getCollegeIdsByExamIds(allExamIds)
      : [];

  const recommendedCollegeIds =
    (examCtx.recommendedExamIds || []).length > 0
      ? await CollegeRecommendedExam.getCollegeIdsByExamIds(examCtx.recommendedExamIds)
      : [];

  const shortlistedCollegeIds =
    (examCtx.shortlistedExamIds || []).length > 0
      ? await CollegeRecommendedExam.getCollegeIdsByExamIds(examCtx.shortlistedExamIds)
      : [];

  const shortlistedScholarshipIds = [
    ...new Set(
      (Array.isArray(academics?.user_shortlisted_scholarships)
        ? academics.user_shortlisted_scholarships
        : []
      )
        .map((id) => Number(id))
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  return {
    streamId: examCtx.streamId,
    message: examCtx.message,
    allExamIds,
    allCollegeIds,
    recommendedExamIds: examCtx.recommendedExamIds || [],
    shortlistedExamIds: examCtx.shortlistedExamIds || [],
    recommendedCollegeIds,
    shortlistedCollegeIds,
    shortlistedScholarshipIds,
    userCity: address?.city_town_village?.trim() || null,
  };
}

async function getInstituteIdsForPool(ctx) {
  if (!ctx.poolExamIds?.length) return [];
  return InstituteExam.getInstituteIdsByExamIds(ctx.poolExamIds);
}

async function getInstituteDeliveryTabTotals(ctx) {
  const ids = await getInstituteIdsForPool(ctx);
  let online = 0;
  let offline = 0;
  if (ids.length) {
    const result = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(type, ''))) IN ('online', 'hybrid'))::int AS online,
         COUNT(*) FILTER (WHERE LOWER(TRIM(COALESCE(type, ''))) IN ('offline', 'hybrid'))::int AS offline
       FROM institutes
       WHERE id = ANY($1::int[])`,
      [ids]
    );
    const row = result.rows[0] || {};
    online = Number(row.online) || 0;
    offline = Number(row.offline) || 0;
  }
  return {
    online,
    offline,
    shortlisted: ctx.shortlistedInstituteIds.length,
  };
}

async function resolveScholarshipIdsForTab(tab, ctx) {
  if (tab === 'all') {
    const [byExam, byCollege] = await Promise.all([
      ctx.allExamIds.length > 0
        ? ScholarshipExam.getScholarshipIdsByExamIds(ctx.allExamIds)
        : [],
      ctx.allCollegeIds.length > 0
        ? ScholarshipCollege.getScholarshipIdsByCollegeIds(ctx.allCollegeIds)
        : [],
    ]);
    return [...new Set([...byExam, ...byCollege])];
  }
  if (tab === 'recommended') {
    const examUnion = [
      ...new Set(
        [...ctx.shortlistedExamIds, ...ctx.recommendedExamIds]
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];
    const collegeUnion = [
      ...new Set(
        [...ctx.shortlistedCollegeIds, ...ctx.recommendedCollegeIds]
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0)
      ),
    ];
    const [byExam, byCollege] = await Promise.all([
      examUnion.length > 0 ? ScholarshipExam.getScholarshipIdsByExamIds(examUnion) : [],
      collegeUnion.length > 0 ? ScholarshipCollege.getScholarshipIdsByCollegeIds(collegeUnion) : [],
    ]);
    return [...new Set([...byExam, ...byCollege])];
  }
  if (tab === 'shortlisted') {
    return ctx.shortlistedScholarshipIds;
  }
  return [];
}

module.exports = {
  loadDashboardInstituteContext,
  loadDashboardScholarshipContext,
  getInstituteIdsForPool,
  getInstituteDeliveryTabTotals,
  resolvePoolExamIdsForInstitutes,
  resolveScholarshipIdsForTab,
};
