const UserAcademics = require('../../models/user/UserAcademics');
const UserAddress = require('../../models/user/UserAddress');
const UserCareerGoals = require('../../models/user/UserCareerGoals');
/** Lazy require avoids circular dependency with examsController (enrichCollegeRows). */
function loadDashboardExamShortlistContext(userId) {
  const { loadDashboardExamShortlistContext: loadCtx } = require('./examsController');
  if (typeof loadCtx !== 'function') {
    throw new Error('loadDashboardExamShortlistContext is not available');
  }
  return loadCtx(userId);
}
const {
  sortAllColleges,
  sortRecommendedColleges,
  sortShortlistedColleges,
} = require('../../services/collegeDashboardSort');
const {
  getCachedSortedCollegeIds,
  setCachedSortedCollegeIds,
  invalidateDashboardCollegeSortCacheForUser,
} = require('../../services/dashboardCollegeSortCache');
const { filterCollegesBySearch } = require('../../utils/collegeSearchFilter');
const ExamCareerGoal = require('../../models/exam/ExamCareerGoal');
const ExamEligibilityCriteria = require('../../models/exam/ExamEligibilityCriteria');
const CollegeRecommendedExam = require('../../models/college/CollegeRecommendedExam');
const College = require('../../models/college/College');
const Exam = require('../../models/taxonomy/Exam');
const StreamInterestRecommendation = require('../../models/mapping/StreamInterestRecommendation');
const { computeRecommendedExamIdsTop20 } = require('../../services/examDashboardRecommendation');
const CollegeDetails = require('../../models/college/CollegeDetails');
const CollegeKeyDates = require('../../models/college/CollegeKeyDates');
const CollegeDocumentsRequired = require('../../models/college/CollegeDocumentsRequired');
const CollegeCounsellingProcess = require('../../models/college/CollegeCounsellingProcess');
const CollegeProgram = require('../../models/college/CollegeProgram');
const CollegePreviousCutoff = require('../../models/college/CollegePreviousCutoff');
const CollegeExpectedCutoff = require('../../models/college/CollegeExpectedCutoff');
const CollegeSeatMatrix = require('../../models/college/CollegeSeatMatrix');
const Lecture = require('../../models/taxonomy/Lecture');
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
      abbreviation: r.exam_abbreviation ?? null,
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

function parseMajorProgramIds(raw) {
  if (raw == null || raw === '') return [];
  return [...new Set(
    String(raw)
      .split(/[,;]/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
  )];
}

async function resolveMajorProgramNames(majorProgramIdsRaw) {
  const ids = parseMajorProgramIds(majorProgramIdsRaw);
  if (!ids.length) return [];
  const result = await db.query(
    'SELECT id, name FROM programs WHERE id = ANY($1::int[]) ORDER BY name ASC',
    [ids]
  );
  return result.rows.map((r) => r.name).filter(Boolean);
}

function parseExamIdsFromField(raw) {
  if (raw == null || raw === '') return [];
  return [...new Set(
    String(raw)
      .split(/[,;]/)
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0)
  )];
}

async function resolveExamNameMap(examIds) {
  if (!examIds?.length) return new Map();
  const result = await db.query(
    'SELECT id, name, code FROM exams_taxonomies WHERE id = ANY($1::int[])',
    [examIds]
  );
  const map = new Map();
  for (const r of result.rows) {
    const label = r.name?.trim() || r.code?.trim() || `Exam ${r.id}`;
    map.set(Number(r.id), label);
  }
  return map;
}

/** Full college payload for detail page (programs + cutoffs + seat matrix). */
async function enrichCollegeDetail(college) {
  const [base] = await enrichCollegeRows([college]);
  if (!base) return null;

  const programs = base.programs || [];
  const programIds = programs.map((p) => p.id).filter((id) => id != null);

  const [previousCutoffRows, expectedCutoffRows, seatMatrixRows, majorProgramNames] =
    await Promise.all([
      programIds.length
        ? CollegePreviousCutoff.findByCollegeProgramIds(programIds)
        : [],
      programIds.length
        ? CollegeExpectedCutoff.findByCollegeProgramIds(programIds)
        : [],
      programIds.length ? CollegeSeatMatrix.findByCollegeProgramIds(programIds) : [],
      resolveMajorProgramNames(base.collegeDetails?.major_program_ids),
    ]);

  const prevByProgram = groupByCollegeId(previousCutoffRows, 'college_program_id');
  const expByProgram = groupByCollegeId(expectedCutoffRows, 'college_program_id');
  const seatByProgram = groupByCollegeId(seatMatrixRows, 'college_program_id');

  const allProgramExamIds = [
    ...new Set(programs.flatMap((p) => parseExamIdsFromField(p.recommended_exam_ids))),
  ];
  const examNameById = await resolveExamNameMap(allProgramExamIds);

  return {
    ...base,
    majorProgramNames,
    programs: programs.map((p) => {
      const recIds = parseExamIdsFromField(p.recommended_exam_ids);
      const recommendedExamNames = recIds
        .map((id) => examNameById.get(id))
        .filter(Boolean);
      return {
        ...p,
        recommendedExamNames,
        previousCutoffs: prevByProgram.get(p.id) || [],
        expectedCutoffs: expByProgram.get(p.id) || [],
        seatMatrix: seatByProgram.get(p.id) || [],
      };
    }),
  };
}

async function resolveCollegeRef(ref) {
  const raw = String(ref || '').trim();
  if (!raw) return null;
  const asId = parseInt(raw, 10);
  if (String(asId) === raw && asId > 0) {
    return College.findById(asId);
  }
  return College.findBySlug(raw);
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

async function loadDashboardCollegeShortlistContext(userId) {
  const examCtx = await loadDashboardExamShortlistContext(userId);
  const [academics, address] = await Promise.all([
    UserAcademics.findByUserId(userId),
    UserAddress.findByUserId(userId),
  ]);

  const shortlistedRaw = Array.isArray(academics?.user_shortlisted_colleges)
    ? academics.user_shortlisted_colleges
    : [];
  const shortlistedCollegeIds = [
    ...new Set(
      shortlistedRaw.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];

  const userCity = address?.city_town_village?.trim() || null;
  const allExamIds = (examCtx.streamExams || [])
    .map((e) => Number(e.id))
    .filter((id) => Number.isInteger(id));

  return {
    streamId: examCtx.streamId,
    message: examCtx.message,
    allExamIds,
    recommendedExamIds: examCtx.recommendedExamIds || [],
    shortlistedExamIds: examCtx.shortlistedExamIds || [],
    shortlistedCollegeIds,
    userCity,
  };
}

async function resolveCollegeIdsForTab(tab, ctx) {
  if (tab === 'all') {
    return ctx.allExamIds.length > 0
      ? CollegeRecommendedExam.getCollegeIdsByExamIds(ctx.allExamIds)
      : [];
  }
  if (tab === 'recommended') {
    const examUnion = [
      ...new Set([...ctx.shortlistedExamIds, ...ctx.recommendedExamIds].map(Number)),
    ].filter((id) => Number.isInteger(id) && id > 0);
    return examUnion.length > 0
      ? CollegeRecommendedExam.getCollegeIdsByExamIds(examUnion)
      : [];
  }
  if (tab === 'shortlisted') {
    return ctx.shortlistedCollegeIds;
  }
  return [];
}

async function buildOrderedCollegeIdsForTab(tab, ctx) {
  const collegeIds = await resolveCollegeIdsForTab(tab, ctx);
  if (!collegeIds.length) return [];

  const colleges = await College.findByIds(collegeIds);
  if (!colleges.length) return [];

  const ids = colleges.map((c) => c.id);
  const needsExamTiers =
    tab === 'recommended' || (tab === 'shortlisted' && ctx.shortlistedExamIds.length > 0);
  const examIdsMap = needsExamTiers
    ? await CollegeRecommendedExam.getExamIdsMapByCollegeIds(ids)
    : new Map();

  let sorted;
  if (tab === 'all') {
    sorted = sortAllColleges(colleges, ctx.userCity);
  } else if (tab === 'recommended') {
    sorted = sortRecommendedColleges(
      colleges,
      ctx.userCity,
      ctx.shortlistedExamIds,
      ctx.recommendedExamIds,
      examIdsMap
    );
  } else {
    sorted = sortShortlistedColleges(
      colleges,
      ctx.userCity,
      ctx.shortlistedExamIds,
      ctx.recommendedExamIds,
      examIdsMap
    );
  }
  return sorted.map((c) => c.id);
}

async function getOrderedCollegeIdsForTab(userId, tab, ctx) {
  const cached = await getCachedSortedCollegeIds(userId, tab, ctx);
  if (cached) return cached;

  const ids = await buildOrderedCollegeIdsForTab(tab, ctx);
  await setCachedSortedCollegeIds(userId, tab, ctx, ids);
  return ids;
}

async function applyCollegeSearchFilter(orderedIds, searchRaw) {
  const q = String(searchRaw || '').trim();
  if (!q || !orderedIds.length) return { ids: orderedIds, examLabelsByCollegeId: null };

  const colleges = await College.findByIdsPreservingOrder(orderedIds);
  const examLinkRows = await CollegeRecommendedExam.getExamLinksForCollegeIds(orderedIds);
  const examLabelsByCollegeId = new Map();
  for (const row of examLinkRows) {
    const cid = row.college_id;
    if (!examLabelsByCollegeId.has(cid)) examLabelsByCollegeId.set(cid, []);
    const labels = examLabelsByCollegeId.get(cid);
    if (row.exam_name) labels.push(row.exam_name);
    if (row.exam_code) labels.push(row.exam_code);
  }

  const filtered = filterCollegesBySearch(colleges, q, examLabelsByCollegeId);
  return { ids: filtered.map((c) => c.id), examLabelsByCollegeId };
}

async function getTabTotals(userId, ctx) {
  const [allIds, recIds] = await Promise.all([
    getOrderedCollegeIdsForTab(userId, 'all', ctx),
    getOrderedCollegeIdsForTab(userId, 'recommended', ctx),
  ]);
  return {
    all: allIds.length,
    recommended: recIds.length,
    shortlisted: ctx.shortlistedCollegeIds.length,
  };
}

/**
 * Lightweight meta for sidebar badge + React Query (no enriched college rows).
 * GET /api/auth/profile/dashboard-colleges/meta
 */
async function getDashboardCollegesMeta(req, res) {
  try {
    const ctx = await loadDashboardCollegeShortlistContext(req.user.id);
    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          shortlistedCollegeIds: [],
          tabTotals: { all: 0, recommended: 0, shortlisted: 0 },
          message: ctx.message,
        },
      });
    }

    const tabTotals = await getTabTotals(req.user.id, ctx);
    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        shortlistedCollegeIds: ctx.shortlistedCollegeIds,
        tabTotals,
        message:
          tabTotals.all === 0 && tabTotals.recommended === 0
            ? 'No colleges match your exam filters yet. Tag exams on colleges in admin or widen mappings.'
            : undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard colleges meta:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard colleges meta',
    });
  }
}

/**
 * Paginated colleges for one tab; enrich only current page.
 * GET /api/auth/profile/dashboard-colleges/tab?tab=all|recommended|shortlisted&page=&limit=&search=
 */
async function getDashboardCollegesTab(req, res) {
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

    const ctx = await loadDashboardCollegeShortlistContext(req.user.id);
    if (ctx.streamId == null) {
      return res.json({
        success: true,
        data: {
          streamId: null,
          tab,
          colleges: [],
          shortlistedCollegeIds: [],
          pagination: { page: 1, limit, total: 0, totalPages: 1 },
          message: ctx.message,
        },
      });
    }

    const orderedIds = await getOrderedCollegeIdsForTab(req.user.id, tab, ctx);
    const { ids: filteredIds } = await applyCollegeSearchFilter(orderedIds, search);
    const total = filteredIds.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const pageIds = filteredIds.slice(start, start + limit);
    const pageRows = await College.findByIdsPreservingOrder(pageIds);
    const colleges = await enrichCollegeRows(pageRows);

    const listMessage =
      total === 0
        ? search
          ? 'No colleges match your search.'
          : tab === 'shortlisted'
            ? 'Shortlist colleges from Recommended or All Colleges to see them here.'
            : 'No colleges available in this section.'
        : undefined;

    return res.json({
      success: true,
      data: {
        streamId: ctx.streamId,
        tab,
        colleges,
        shortlistedCollegeIds: ctx.shortlistedCollegeIds,
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
    console.error('Error fetching dashboard colleges tab:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard colleges',
    });
  }
}

/** @deprecated Use dashboard-colleges/meta — kept for older clients. */
async function getDashboardColleges(req, res) {
  return getDashboardCollegesMeta(req, res);
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

    await invalidateDashboardCollegeSortCacheForUser(userId);

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

/**
 * Colleges whose recommended exam id matches this exam (college + program level).
 * GET /api/auth/profile/exams/:examId/colleges
 */
/**
 * Single college for dashboard detail (id or slug).
 * GET /api/auth/profile/dashboard-colleges/:collegeRef
 */
async function getDashboardCollegeByRef(req, res) {
  try {
    const userId = req.user.id;
    const college = await resolveCollegeRef(req.params.collegeRef);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'College not found',
      });
    }

    const [enriched, academics] = await Promise.all([
      enrichCollegeDetail(college),
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

    const shortlistedRaw = Array.isArray(academics?.user_shortlisted_colleges)
      ? academics.user_shortlisted_colleges
      : [];
    const shortlistedCollegeIds = shortlistedRaw
      .map((n) => Number(n))
      .filter((n) => Number.isInteger(n) && n > 0);

    return res.json({
      success: true,
      data: {
        college: enriched,
        shortlistedCollegeIds,
        taggedLectureCount,
        taggedLecturePreviews,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard college detail:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch college details',
    });
  }
}

async function getCollegesForExam(req, res) {
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

    const collegeIds = await CollegeRecommendedExam.getCollegeIdsByRecommendedExamId(examId);
    const colleges = await enrichCollegeRows(await College.findByIds(collegeIds));

    return res.json({
      success: true,
      data: {
        examId,
        colleges,
        totalCount: colleges.length,
      },
    });
  } catch (error) {
    console.error('Error fetching colleges for exam:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch colleges for exam',
    });
  }
}

module.exports = {
  getRecommendedColleges,
  getDashboardColleges,
  getDashboardCollegesMeta,
  getDashboardCollegesTab,
  getDashboardCollegeByRef,
  getCollegesForExam,
  updateShortlistedColleges,
  enrichCollegeRows,
  enrichCollegeDetail,
};
