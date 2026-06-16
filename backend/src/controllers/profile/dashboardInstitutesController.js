const UserAcademics = require('../../models/user/UserAcademics');
const Institute = require('../../models/institute/Institute');
const InstituteExam = require('../../models/institute/InstituteExam');
const InstituteDetails = require('../../models/institute/InstituteDetails');
const InstituteStatistics = require('../../models/institute/InstituteStatistics');
const InstituteCourse = require('../../models/institute/InstituteCourse');
const Lecture = require('../../models/taxonomy/Lecture');
const Exam = require('../../models/taxonomy/Exam');
const db = require('../../config/database');
const {
  sortDeliveryInstitutes,
  sortShortlistedInstitutes,
} = require('../../services/instituteDashboardSort');
const {
  getCachedSortedInstituteIds,
  setCachedSortedInstituteIds,
} = require('../../services/dashboardInstituteSortCache');
const {
  loadDashboardInstituteContext,
  getInstituteIdsForPool,
  getInstituteDeliveryTabTotals,
} = require('../../services/dashboardInstituteScholarshipContext');
const { filterInstitutesBySearch } = require('../../utils/instituteSearchFilter');

async function enrichInstituteRows(institutes) {
  if (!institutes || institutes.length === 0) return [];
  const ids = institutes.map((i) => i.id).filter((id) => id != null);
  if (ids.length === 0) return [];

  const [examLinkRows, detailsMap, statisticsMap] = await Promise.all([
    InstituteExam.getExamLinksForInstituteIds(ids),
    InstituteDetails.findByInstituteIds(ids),
    InstituteStatistics.findByInstituteIds(ids),
  ]);
  const examMap = new Map();
  for (const row of examLinkRows) {
    const iid = row.institute_id;
    if (!examMap.has(iid)) examMap.set(iid, []);
    examMap.get(iid).push({
      id: row.exam_id,
      name: row.exam_name,
      code: row.exam_code,
      abbreviation: row.exam_abbreviation ?? null,
    });
  }
  return institutes.map((inst) => {
    const detailsRow = detailsMap.get(inst.id);
    const statisticsRow = statisticsMap.get(inst.id);
    return {
      ...inst,
      linkedExams: examMap.get(inst.id) || [],
      institute_description: detailsRow?.institute_description ?? null,
      instituteDetails: detailsRow
        ? {
            demo_available: detailsRow.demo_available,
            scholarship_available: detailsRow.scholarship_available,
          }
        : null,
      statistics: statisticsRow
        ? {
            ranking_score: statisticsRow.ranking_score,
            success_rate: statisticsRow.success_rate,
            student_rating: statisticsRow.student_rating,
          }
        : null,
    };
  });
}

async function buildOrderedInstituteIdsForDelivery(userId, delivery, ctx) {
  const cached = await getCachedSortedInstituteIds(userId, delivery, ctx);
  if (cached) return cached;

  let orderedIds = [];

  if (delivery === 'shortlisted') {
    const instituteIds = ctx.shortlistedInstituteIds || [];
    if (instituteIds.length) {
      const institutes = await Institute.findByIds(instituteIds);
      const examIdsMap =
        (ctx.shortlistedExamIds || []).length > 0
          ? await InstituteExam.getExamIdsMapByInstituteIds(institutes.map((i) => i.id))
          : new Map();
      const sorted = sortShortlistedInstitutes(institutes, ctx, examIdsMap);
      orderedIds = sorted.map((i) => i.id);
    }
  } else {
    const instituteIds = await getInstituteIdsForPool(ctx);
    if (instituteIds.length) {
      const institutes = await Institute.findByIds(instituteIds);
      const examIdsMap = await InstituteExam.getExamIdsMapByInstituteIds(
        institutes.map((i) => i.id)
      );
      const sorted = sortDeliveryInstitutes(institutes, delivery, ctx, examIdsMap);
      orderedIds = sorted.map((i) => i.id);
    }
  }

  await setCachedSortedInstituteIds(userId, delivery, ctx, orderedIds);
  return orderedIds;
}

/**
 * GET /api/auth/profile/dashboard-institutes/meta
 */
async function getDashboardInstitutesMeta(req, res) {
  try {
    const ctx = await loadDashboardInstituteContext(req.user.id);
    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          shortlistedInstituteIds: ctx.shortlistedInstituteIds,
          tabTotals: {
            online: 0,
            offline: 0,
            shortlisted: ctx.shortlistedInstituteIds.length,
          },
          message: ctx.message,
        },
      });
    }

    const tabTotals = await getInstituteDeliveryTabTotals(ctx);
    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        shortlistedInstituteIds: ctx.shortlistedInstituteIds,
        tabTotals,
        message:
          tabTotals.online === 0 && tabTotals.offline === 0
            ? 'No coaching institutes match your exam filters yet.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard institutes meta:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching institutes meta',
    });
  }
}

async function applyInstituteSearchFilter(orderedIds, searchRaw) {
  const q = String(searchRaw || '').trim();
  if (!q || !orderedIds.length) return orderedIds;

  const institutes = await Institute.findByIds(orderedIds);
  const examLinkRows = await InstituteExam.getExamLinksForInstituteIds(orderedIds);
  const examLabelsByInstituteId = new Map();
  for (const row of examLinkRows) {
    const iid = row.institute_id;
    if (!examLabelsByInstituteId.has(iid)) examLabelsByInstituteId.set(iid, []);
    const labels = examLabelsByInstituteId.get(iid);
    if (row.exam_name) labels.push(row.exam_name);
    if (row.exam_code) labels.push(row.exam_code);
  }

  const filtered = filterInstitutesBySearch(institutes, q, examLabelsByInstituteId);
  return filtered.map((i) => i.id);
}

/**
 * GET /api/auth/profile/dashboard-institutes/tab?delivery=online|offline|shortlisted&page=&limit=&search=
 */
async function getDashboardInstitutesTab(req, res) {
  try {
    const delivery = String(req.query.delivery || '').toLowerCase();
    if (!['online', 'offline', 'shortlisted'].includes(delivery)) {
      return res.status(400).json({
        success: false,
        message: 'delivery must be online, offline, or shortlisted',
      });
    }

    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);
    const page = Math.max(1, Number.isInteger(pageRaw) ? pageRaw : 1);
    const limit = Math.min(50, Math.max(1, Number.isInteger(limitRaw) ? limitRaw : 10));
    const search = String(req.query.search || '').trim();

    const userId = req.user.id;
    const ctx = await loadDashboardInstituteContext(userId);

    if (ctx.streamId == null && delivery !== 'shortlisted') {
      return res.json({
        success: true,
        data: {
          streamId: null,
          delivery,
          institutes: [],
          shortlistedInstituteIds: ctx.shortlistedInstituteIds,
          pagination: { page: 1, limit, total: 0, totalPages: 1 },
          message: ctx.message,
        },
      });
    }

    const orderedIds = await buildOrderedInstituteIdsForDelivery(userId, delivery, ctx);
    const filteredIds = await applyInstituteSearchFilter(orderedIds, search);
    const total = filteredIds.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageIds = filteredIds.slice(start, start + limit);
    const pageRows = await Institute.findByIds(pageIds);
    const institutes = await enrichInstituteRows(pageRows);

    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        delivery,
        institutes,
        shortlistedInstituteIds: ctx.shortlistedInstituteIds,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
        message:
          total === 0
            ? search
              ? 'No coaching institutes match your search.'
              : delivery === 'shortlisted'
                ? 'No shortlisted coaching institutes yet. Shortlist institutes from the Online or Offline tabs.'
                : `No ${delivery} coaching institutes match your exam filters yet.`
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard institutes tab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching institutes',
    });
  }
}

async function resolveInstituteRef(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return null;
  const asId = parseInt(raw, 10);
  if (String(asId) === raw && asId > 0) {
    return Institute.findById(asId);
  }
  return Institute.findBySlug(raw);
}

async function enrichInstituteDetail(institute) {
  const [base] = await enrichInstituteRows([institute]);
  if (!base) return null;

  const [instituteDetails, statistics, courses] = await Promise.all([
    InstituteDetails.findByInstituteId(institute.id),
    InstituteStatistics.findByInstituteId(institute.id),
    InstituteCourse.findByInstituteId(institute.id),
  ]);

  return {
    ...base,
    instituteDetails,
    statistics,
    courses,
  };
}

/**
 * GET /api/auth/profile/dashboard-institutes/:instituteRef
 */
async function getDashboardInstituteByRef(req, res) {
  try {
    const userId = req.user.id;
    const institute = await resolveInstituteRef(req.params.instituteRef);
    if (!institute) {
      return res.status(404).json({
        success: false,
        message: 'Coaching institute not found',
      });
    }

    const [enriched, academics] = await Promise.all([
      enrichInstituteDetail(institute),
      UserAcademics.findByUserId(userId),
    ]);

    const linkedExamIds = (enriched.linkedExams || [])
      .map((e) => Number(e.id))
      .filter((n) => Number.isInteger(n) && n > 0);

    const [taggedLectureCount, taggedLectureRows] = await Promise.all([
      linkedExamIds.length
        ? Lecture.countVideoLecturesByExamIds(linkedExamIds)
        : Promise.resolve(0),
      linkedExamIds.length
        ? Lecture.findVideoPreviewsByExamIds(linkedExamIds, 5)
        : Promise.resolve([]),
    ]);

    const taggedLecturePreviews = taggedLectureRows.map((row) => ({
      id: row.id,
      title: (row.youtube_title && String(row.youtube_title).trim()) || 'Untitled video',
      channel: (row.youtube_channel_name && String(row.youtube_channel_name).trim()) || null,
      subjectName: row.subject_name || null,
      topicName: row.topic_name || null,
      hookSummary:
        row.hook_summary != null && String(row.hook_summary).trim() !== ''
          ? String(row.hook_summary).trim()
          : null,
    }));

    const shortlistedInstituteIds = [
      ...new Set(
        (Array.isArray(academics?.user_shortlisted_institutes)
          ? academics.user_shortlisted_institutes
          : []
        )
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
      ),
    ];

    return res.json({
      success: true,
      data: {
        institute: enriched,
        shortlistedInstituteIds,
        taggedLectureCount,
        taggedLecturePreviews,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard institute detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching institute details',
    });
  }
}

/** @deprecated Use dashboard-institutes/meta */
async function getDashboardInstitutes(req, res) {
  return getDashboardInstitutesMeta(req, res);
}

/**
 * Coaching institutes linked to this exam (institute_exams + institute_exam_specialization).
 * GET /api/auth/profile/exams/:examId/institutes
 */
async function getInstitutesForExam(req, res) {
  try {
    const examId = parseInt(req.params.examId, 10);
    if (!Number.isInteger(examId) || examId < 1) {
      return res.status(400).json({
        success: false,
        message: 'examId must be a positive integer',
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Exam not found',
      });
    }

    const instituteIds = await InstituteExam.getInstituteIdsByExamIds([examId]);
    const institutes = await enrichInstituteRows(await Institute.findByIds(instituteIds));

    return res.json({
      success: true,
      data: {
        examId,
        institutes,
        totalCount: institutes.length,
      },
    });
  } catch (error) {
    console.error('Error fetching institutes for exam:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch coaching institutes for exam',
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
  getDashboardInstitutesMeta,
  getDashboardInstitutesTab,
  getDashboardInstituteByRef,
  getInstitutesForExam,
  updateShortlistedInstitutes,
};
