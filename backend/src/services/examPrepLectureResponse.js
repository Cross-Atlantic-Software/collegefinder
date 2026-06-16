const UserAcademics = require('../models/user/UserAcademics');
const Lecture = require('../models/taxonomy/Lecture');
const {
  extractYouTubeVideoId,
  fetchYouTubeVideosDurationSecondsMap,
} = require('../utils/youtubeMetadata');
const { loadDashboardExamShortlistContext } = require('../controllers/profile/examsController');
const {
  filterExamPrepLectureRows,
  sortExamPrepLectureRows,
} = require('./examPrepLectureFilter');

function compareExamPrepForSortMode(a, b, sortMode) {
  const tierDiff = (a.exam_tier ?? 2) - (b.exam_tier ?? 2);
  if (tierDiff !== 0) return tierDiff;

  if (sortMode === 'popular') {
    const rankDiff = Number(b.rank_score ?? 0) - Number(a.rank_score ?? 0);
    if (rankDiff !== 0) return rankDiff;
  } else {
    const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
    const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
    const recDiff = bTime - aTime;
    if (recDiff !== 0) return recDiff;
  }

  return Number(b.rank_score ?? 0) - Number(a.rank_score ?? 0);
}

async function rowsToLectureDtos(rows, { limit } = {}) {
  const slice = limit != null && limit > 0 ? rows.slice(0, limit) : rows;

  const apiKey =
    process.env.YOUTUBE_API_KEY ||
    process.env.GOOGLE_YOUTUBE_API_KEY ||
    process.env.GOOGLE_API_KEY;

  const youtubeIdsForBatch = [];
  for (const row of slice) {
    const iframe = row.iframe_code != null ? String(row.iframe_code) : '';
    const file = row.video_file != null ? String(row.video_file) : '';
    const yid = extractYouTubeVideoId(iframe) || extractYouTubeVideoId(file);
    if (yid) youtubeIdsForBatch.push(yid);
  }

  let durationByVideoId = new Map();
  try {
    if (youtubeIdsForBatch.length && apiKey) {
      durationByVideoId = await fetchYouTubeVideosDurationSecondsMap(youtubeIdsForBatch, apiKey);
    }
  } catch (durErr) {
    console.error('Exam prep: YouTube duration batch failed:', durErr.message || durErr);
  }

  const lectures = [];
  for (const row of slice) {
    const iframe = row.iframe_code != null ? String(row.iframe_code) : '';
    const file = row.video_file != null ? String(row.video_file) : '';
    const youtubeId = extractYouTubeVideoId(iframe) || extractYouTubeVideoId(file);
    if (!youtubeId) continue;

    const likes = row.youtube_like_count != null ? Number(row.youtube_like_count) : 0;
    const subs = row.youtube_subscriber_count != null ? Number(row.youtube_subscriber_count) : 0;
    const rankScore =
      row.rank_score != null && !Number.isNaN(Number(row.rank_score))
        ? Number(row.rank_score)
        : likes + subs / 1000;

    const durationSeconds = durationByVideoId.has(youtubeId)
      ? durationByVideoId.get(youtubeId)
      : null;

    lectures.push({
      id: row.id,
      youtubeId,
      iframeCode: iframe.trim() || null,
      videoFile: file.trim() || null,
      title: (row.youtube_title && String(row.youtube_title).trim()) || 'Untitled lecture',
      channel: (row.youtube_channel_name && String(row.youtube_channel_name).trim()) || 'YouTube',
      hookSummary:
        row.hook_summary != null && String(row.hook_summary).trim() !== ''
          ? String(row.hook_summary).trim()
          : null,
      likes: Number.isFinite(likes) ? likes : 0,
      subscribers: Number.isFinite(subs) ? subs : 0,
      rankScore,
      examTier: row.exam_tier != null ? Number(row.exam_tier) : 2,
      examIds: Array.isArray(row.exam_ids) ? row.exam_ids.map(Number) : [],
      updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : new Date(0).toISOString(),
      subjectId: String(row.subject_id),
      subjectName: row.subject_name || 'Subject',
      topicId: row.topic_id,
      topicName: row.topic_name || 'Topic',
      durationSeconds:
        durationSeconds != null && Number.isFinite(durationSeconds) ? durationSeconds : null,
    });
  }

  return lectures;
}

function matchesSearch(row, searchRaw) {
  const q = String(searchRaw || '')
    .trim()
    .toLowerCase();
  if (!q) return true;
  const hay = [
    row.youtube_title,
    row.youtube_channel_name,
    row.subject_name,
    row.topic_name,
    row.hook_summary,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

async function loadExamPrepLectureContext(userId) {
  const [academics, examCtx] = await Promise.all([
    UserAcademics.findByUserId(userId),
    loadDashboardExamShortlistContext(userId),
  ]);

  if (!academics || !academics.stream_id) {
    return {
      streamId: null,
      requiresStreamSelection: true,
      examCtx: null,
      message: 'Please select your stream in your academics profile first',
    };
  }

  return {
    streamId: Number(academics.stream_id),
    requiresStreamSelection: false,
    examCtx,
    message: undefined,
  };
}

async function fetchFilteredExamPrepRows(userId, { subjectId, search } = {}) {
  const ctx = await loadExamPrepLectureContext(userId);
  if (ctx.requiresStreamSelection) {
    return { ctx, rows: [] };
  }

  const sid = subjectId != null && String(subjectId).trim() !== '' ? Number(subjectId) : null;
  const subjectNum = Number.isInteger(sid) && sid > 0 ? sid : null;

  let rows = await Lecture.findVideoLecturesForExamPrepByStream(ctx.streamId, {
    subjectId: subjectNum,
  });

  rows = sortExamPrepLectureRows(
    filterExamPrepLectureRows(rows, {
      shortlistedExamIds: ctx.examCtx.shortlistedExamIds || [],
      recommendedExamIds: ctx.examCtx.recommendedExamIds || [],
    })
  );

  if (search) {
    rows = rows.filter((row) => matchesSearch(row, search));
  }

  return { ctx, rows };
}

async function getExamPrepRecommendedLecture(userId, { sort = 'latest' } = {}) {
  const { ctx, rows } = await fetchFilteredExamPrepRows(userId, {});
  if (ctx.requiresStreamSelection) {
    return {
      requiresStreamSelection: true,
      lecture: null,
      lectures: [],
      message: ctx.message,
    };
  }

  const sortMode = String(sort).toLowerCase() === 'popular' ? 'popular' : 'latest';
  const bySubject = new Map();
  for (const row of rows) {
    const sid = String(row.subject_id);
    if (!bySubject.has(sid)) bySubject.set(sid, []);
    bySubject.get(sid).push(row);
  }

  const topRowsPerSubject = [];
  for (const subjectRows of bySubject.values()) {
    const sorted = [...subjectRows].sort((a, b) => compareExamPrepForSortMode(a, b, sortMode));
    if (sorted[0]) topRowsPerSubject.push(sorted[0]);
  }

  topRowsPerSubject.sort((a, b) =>
    String(a.subject_name || '').localeCompare(String(b.subject_name || ''), undefined, {
      sensitivity: 'base',
    })
  );

  const lectures = await rowsToLectureDtos(topRowsPerSubject);

  return {
    requiresStreamSelection: false,
    stream_id: ctx.streamId,
    lecture: lectures[0] ?? null,
    lectures,
    message: !lectures.length
      ? 'No self-study videos are available for your stream yet.'
      : undefined,
  };
}

async function getExamPrepLecturesForSubject(userId, { subjectId, search } = {}) {
  const subjectNum = Number(subjectId);
  if (!Number.isInteger(subjectNum) || subjectNum <= 0) {
    return {
      requiresStreamSelection: false,
      lectures: [],
      message: 'subjectId is required',
    };
  }

  const { ctx, rows } = await fetchFilteredExamPrepRows(userId, { subjectId: subjectNum, search });
  if (ctx.requiresStreamSelection) {
    return {
      requiresStreamSelection: true,
      lectures: [],
      message: ctx.message,
    };
  }

  const lectures = await rowsToLectureDtos(rows);

  return {
    requiresStreamSelection: false,
    stream_id: ctx.streamId,
    subjectId: subjectNum,
    lectures,
  };
}

module.exports = {
  getExamPrepRecommendedLecture,
  getExamPrepLecturesForSubject,
};
