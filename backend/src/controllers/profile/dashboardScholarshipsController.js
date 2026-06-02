const UserAcademics = require('../../models/user/UserAcademics');
const Scholarship = require('../../models/scholarship/Scholarship');
const ScholarshipExam = require('../../models/scholarship/ScholarshipExam');
const ScholarshipCollege = require('../../models/scholarship/ScholarshipCollege');
const ScholarshipEligibleCategory = require('../../models/scholarship/ScholarshipEligibleCategory');
const ScholarshipApplicableState = require('../../models/scholarship/ScholarshipApplicableState');
const ScholarshipDocumentsRequired = require('../../models/scholarship/ScholarshipDocumentsRequired');
const Stream = require('../../models/taxonomy/Stream');
const Lecture = require('../../models/taxonomy/Lecture');
const db = require('../../config/database');
const {
  sortAllScholarships,
  sortRecommendedScholarships,
  sortShortlistedScholarships,
} = require('../../services/scholarshipDashboardSort');
const {
  loadDashboardScholarshipContext,
  resolveScholarshipIdsForTab,
} = require('../../services/dashboardInstituteScholarshipContext');
const {
  getCachedSortedScholarshipIds,
  setCachedSortedScholarshipIds,
  invalidateDashboardScholarshipSortCacheForUser,
} = require('../../services/dashboardScholarshipSortCache');
const { filterScholarshipsBySearch } = require('../../utils/scholarshipSearchFilter');

async function enrichScholarshipRows(scholarships) {
  if (!scholarships || scholarships.length === 0) return [];
  const ids = scholarships.map((s) => s.id).filter((id) => id != null);
  if (ids.length === 0) return [];

  const [examLinkRows, collegeLinkRows, applicableStatesMap] = await Promise.all([
    ScholarshipExam.getExamLinksForScholarshipIds(ids),
    ScholarshipCollege.getCollegeLinksForScholarshipIds(ids),
    ScholarshipApplicableState.findByScholarshipIds(ids),
  ]);

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

  const collegeMap = new Map();
  for (const row of collegeLinkRows) {
    const sid = row.scholarship_id;
    if (!collegeMap.has(sid)) collegeMap.set(sid, []);
    collegeMap.get(sid).push({
      id: row.college_id,
      name: row.college_name,
      city: row.city,
      state: row.state,
    });
  }

  const streamIds = [
    ...new Set(
      scholarships.map((s) => s.stream_id).filter((id) => id != null && Number(id) > 0)
    ),
  ];
  const streamRows = streamIds.length ? await Stream.findByIds(streamIds) : [];
  const streamNameById = new Map(streamRows.map((s) => [s.id, s.name]));

  return scholarships.map((sch) => {
    const linkedExams = examMap.get(sch.id) || [];
    const linkedColleges = collegeMap.get(sch.id) || [];
    const streamId = sch.stream_id != null ? Number(sch.stream_id) : null;
    const stateNames = applicableStatesMap.get(sch.id) || [];
    return {
      ...sch,
      linkedExams,
      linkedColleges,
      linkedExamCount: linkedExams.length,
      linkedCollegeCount: linkedColleges.length,
      stream_name:
        streamId && streamNameById.has(streamId) ? streamNameById.get(streamId) : null,
      applicableStates: stateNames.map((state_name) => ({ state_name })),
    };
  });
}

async function buildOrderedScholarshipIdsForTab(tab, ctx) {
  const scholarshipIds = await resolveScholarshipIdsForTab(tab, ctx);
  if (!scholarshipIds.length) return [];

  const rows = await enrichScholarshipRows(await Scholarship.findByIds(scholarshipIds));
  if (!rows.length) return [];

  let sorted;
  if (tab === 'all') {
    sorted = sortAllScholarships(rows, ctx.userCity);
  } else if (tab === 'recommended') {
    sorted = sortRecommendedScholarships(rows, ctx);
  } else {
    sorted = sortShortlistedScholarships(rows, ctx);
  }
  return sorted.map((s) => s.id);
}

async function getOrderedScholarshipIdsForTab(userId, tab, ctx) {
  const cached = await getCachedSortedScholarshipIds(userId, tab, ctx);
  if (cached) return cached;

  const ids = await buildOrderedScholarshipIdsForTab(tab, ctx);
  await setCachedSortedScholarshipIds(userId, tab, ctx, ids);
  return ids;
}

async function getScholarshipTabTotals(userId, ctx) {
  const [allIds, recIds] = await Promise.all([
    getOrderedScholarshipIdsForTab(userId, 'all', ctx),
    getOrderedScholarshipIdsForTab(userId, 'recommended', ctx),
  ]);
  return {
    all: allIds.length,
    recommended: recIds.length,
    shortlisted: ctx.shortlistedScholarshipIds.length,
  };
}

/**
 * GET /api/auth/profile/dashboard-scholarships/meta
 */
async function getDashboardScholarshipsMeta(req, res) {
  try {
    const ctx = await loadDashboardScholarshipContext(req.user.id);
    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          shortlistedScholarshipIds: [],
          tabTotals: { all: 0, recommended: 0, shortlisted: 0 },
          message: ctx.message,
        },
      });
    }

    const tabTotals = await getScholarshipTabTotals(req.user.id, ctx);
    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        shortlistedScholarshipIds: ctx.shortlistedScholarshipIds,
        tabTotals,
        message:
          tabTotals.all === 0 && tabTotals.recommended === 0
            ? 'No scholarships match your exam filters yet.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard scholarships meta:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarships meta',
    });
  }
}

async function applyScholarshipSearchFilter(orderedIds, searchRaw) {
  const q = String(searchRaw || '').trim();
  if (!q || !orderedIds.length) return orderedIds;

  const rows = await enrichScholarshipRows(await Scholarship.findByIds(orderedIds));
  const filtered = filterScholarshipsBySearch(rows, q);
  return filtered.map((s) => s.id);
}

/**
 * GET /api/auth/profile/dashboard-scholarships/tab?tab=all|recommended|shortlisted&page=&limit=&search=
 */
async function getDashboardScholarshipsTab(req, res) {
  try {
    const tab = String(req.query.tab || '').toLowerCase();
    if (!['recommended', 'shortlisted', 'all'].includes(tab)) {
      return res.status(400).json({
        success: false,
        message: 'tab must be recommended, shortlisted, or all',
      });
    }

    const pageRaw = parseInt(req.query.page, 10);
    const limitRaw = parseInt(req.query.limit, 10);
    const page = Math.max(1, Number.isInteger(pageRaw) ? pageRaw : 1);
    const limit = Math.min(50, Math.max(1, Number.isInteger(limitRaw) ? limitRaw : 10));
    const search = String(req.query.search || '').trim();

    const userId = req.user.id;
    const ctx = await loadDashboardScholarshipContext(userId);

    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          tab,
          scholarships: [],
          shortlistedScholarshipIds: [],
          pagination: { page: 1, limit, total: 0, totalPages: 1 },
          message: ctx.message,
        },
      });
    }

    const orderedIds = await getOrderedScholarshipIdsForTab(userId, tab, ctx);
    const filteredIds = await applyScholarshipSearchFilter(orderedIds, search);
    const total = filteredIds.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageIds = filteredIds.slice(start, start + limit);
    const pageRows = await Scholarship.findByIds(pageIds);
    const scholarships = await enrichScholarshipRows(pageRows);

    const listMessage =
      total === 0
        ? search
          ? 'No scholarships match your search.'
          : tab === 'shortlisted'
            ? 'Shortlist scholarships from Recommended or All to see them here.'
            : 'No scholarships available in this section.'
        : undefined;

    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        tab,
        scholarships,
        shortlistedScholarshipIds: ctx.shortlistedScholarshipIds,
        pagination: {
          page: safePage,
          limit,
          total,
          totalPages,
        },
        message: listMessage,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard scholarships tab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarships',
    });
  }
}

async function resolveScholarshipRef(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return null;
  const asId = parseInt(raw, 10);
  if (String(asId) === raw && asId > 0) {
    return Scholarship.findById(asId);
  }
  return Scholarship.findBySlug(raw);
}

async function enrichScholarshipDetail(scholarship) {
  const [base] = await enrichScholarshipRows([scholarship]);
  if (!base) return null;

  const [eligibleCategories, applicableStates, documentsRequired] = await Promise.all([
    ScholarshipEligibleCategory.findByScholarshipId(scholarship.id),
    ScholarshipApplicableState.findByScholarshipId(scholarship.id),
    ScholarshipDocumentsRequired.findByScholarshipId(scholarship.id),
  ]);

  return {
    ...base,
    eligibleCategories,
    applicableStates,
    documentsRequired,
  };
}

/**
 * GET /api/auth/profile/dashboard-scholarships/:scholarshipRef
 */
async function getDashboardScholarshipByRef(req, res) {
  try {
    const userId = req.user.id;
    const scholarship = await resolveScholarshipRef(req.params.scholarshipRef);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: 'Scholarship not found',
      });
    }

    const [enriched, academics] = await Promise.all([
      enrichScholarshipDetail(scholarship),
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

    const shortlistedScholarshipIds = [
      ...new Set(
        (Array.isArray(academics?.user_shortlisted_scholarships)
          ? academics.user_shortlisted_scholarships
          : []
        )
          .map((n) => Number(n))
          .filter((n) => Number.isInteger(n) && n > 0)
      ),
    ];

    return res.json({
      success: true,
      data: {
        scholarship: enriched,
        shortlistedScholarshipIds,
        taggedLectureCount,
        taggedLecturePreviews,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard scholarship detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch scholarship details',
    });
  }
}

/** @deprecated Use dashboard-scholarships/meta */
async function getDashboardScholarships(req, res) {
  return getDashboardScholarshipsMeta(req, res);
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

    await invalidateDashboardScholarshipSortCacheForUser(userId);

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
  getDashboardScholarshipsMeta,
  getDashboardScholarshipsTab,
  getDashboardScholarshipByRef,
  updateShortlistedScholarships,
};
