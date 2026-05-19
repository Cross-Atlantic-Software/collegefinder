/**
 * Dashboard exam recommendation scoring (stream + interest mappings + popularity).
 * Spec: blend "interest match" vs "default" weights from how many user interests
 * list the exam; default channel uses exam_popularity_rank. Top 20 by final score.
 */

const TOP_N = 20;

/**
 * @param {number} k Count of user's selected interests whose stream mapping includes this exam.
 * @param {number} totalUserInterests Number of valid user interest IDs (>=0).
 */
function getInterestDefaultWeights(k, totalUserInterests) {
  const t = Math.max(0, Math.floor(totalUserInterests));
  const kk = Math.max(0, Math.floor(k));
  if (t <= 0 || kk <= 0) {
    return { wInterest: 0, wDefault: 1 };
  }
  if (t >= 3) {
    const m = Math.min(kk, 3);
    if (m >= 3) return { wInterest: 1, wDefault: 0 };
    if (m === 2) return { wInterest: 2 / 3, wDefault: 1 / 3 };
    if (m === 1) return { wInterest: 0.4, wDefault: 0.6 };
    return { wInterest: 0, wDefault: 1 };
  }
  if (t === 2) {
    if (kk >= 2) return { wInterest: 1, wDefault: 0 };
    if (kk === 1) return { wInterest: 2 / 3, wDefault: 1 / 3 };
    return { wInterest: 0, wDefault: 1 };
  }
  if (kk >= 1) return { wInterest: 1, wDefault: 0 };
  return { wInterest: 0, wDefault: 1 };
}

/** Lower exam_popularity_rank = more popular. Null → neutral mid score for default channel. */
function popularityToDefaultScore(rank) {
  if (rank == null || rank === '') return 50;
  const r = Math.round(Number(rank));
  if (!Number.isFinite(r) || r < 1) return 50;
  return Math.max(1, Math.min(100, 101 - r));
}

/**
 * @param {object} exam Row from exams_taxonomies (needs exam_popularity_rank).
 * @param {number} k
 * @param {number} totalUserInterests
 */
function dashboardRecommendationFinalScore(exam, k, totalUserInterests) {
  const { wInterest, wDefault } = getInterestDefaultWeights(k, totalUserInterests);
  const interestMatch = k > 0 ? 100 : 0;
  const defaultMatch = popularityToDefaultScore(exam.exam_popularity_rank);
  const streamMatch = 100;
  const blended = wInterest * interestMatch + wDefault * defaultMatch;
  return (streamMatch / 100) * blended;
}

function buildMappingsByInterest(streamMappings, userInterestIds) {
  const set = new Set(
    userInterestIds.map((x) => (typeof x === 'string' ? parseInt(x, 10) : x)).filter((n) => Number.isInteger(n))
  );
  const m = new Map();
  for (const row of streamMappings) {
    const iid = Number(row.interest_id);
    if (!set.has(iid)) continue;
    m.set(iid, Array.isArray(row.exam_ids) ? row.exam_ids : []);
  }
  return m;
}

function countInterestMatchesForExam(examId, userInterestIds, mappingsByInterest) {
  let k = 0;
  for (const raw of userInterestIds) {
    const iid = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    if (!Number.isInteger(iid)) continue;
    const list = mappingsByInterest.get(iid);
    if (!list || !Array.isArray(list)) continue;
    const ids = list.map((x) => Number(x)).filter((n) => Number.isInteger(n));
    if (ids.includes(Number(examId))) k += 1;
  }
  return k;
}

/**
 * Admin Mapping → Recommended exams: stream_interest_recommendation_mappings rows.
 * For each (stream_id, interest_id) → exam_ids[], tag exams with that interest_id.
 */
function buildExamTagsFromStreamInterestMappings(mappingRows, userInterestIds) {
  const userSet = new Set(
    userInterestIds
      .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((id) => Number.isInteger(id))
  );
  /** @type {Map<number, Set<number>>} */
  const examTagsByExamId = new Map();
  for (const row of mappingRows || []) {
    const iid = Number(row.interest_id);
    if (!Number.isInteger(iid) || !userSet.has(iid)) continue;
    const examIds = Array.isArray(row.exam_ids) ? row.exam_ids : [];
    for (const raw of examIds) {
      const eid = Number(raw);
      if (!Number.isInteger(eid)) continue;
      if (!examTagsByExamId.has(eid)) examTagsByExamId.set(eid, new Set());
      examTagsByExamId.get(eid).add(iid);
    }
  }
  return examTagsByExamId;
}

function mergeExamTagMaps(target, source) {
  for (const [eid, tags] of source.entries()) {
    if (!target.has(eid)) target.set(eid, new Set());
    for (const t of tags) target.get(eid).add(t);
  }
  return target;
}

/** Exam IDs listed in admin mappings for the student's interests (profile + Default stream rows). */
function collectMappedExamIdsForUserInterests(
  mappingRows,
  userInterestIds,
  userStreamId,
  defaultStreamId
) {
  const userSet = new Set(
    userInterestIds
      .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
      .filter((id) => Number.isInteger(id))
  );
  const uid = Number(userStreamId);
  const did =
    defaultStreamId != null && Number.isInteger(Number(defaultStreamId))
      ? Number(defaultStreamId)
      : null;
  const allowedStreams = new Set([uid]);
  if (did != null && did >= 1) allowedStreams.add(did);

  const ids = new Set();
  for (const row of mappingRows || []) {
    const iid = Number(row.interest_id);
    const sid = Number(row.stream_id);
    if (!userSet.has(iid) || !allowedStreams.has(sid)) continue;
    for (const raw of Array.isArray(row.exam_ids) ? row.exam_ids : []) {
      const eid = Number(raw);
      if (Number.isInteger(eid)) ids.add(eid);
    }
  }
  return ids;
}

function sortExamsByPopularityRank(exams) {
  return [...exams].sort((a, b) => {
    const ar = a.exam_popularity_rank;
    const br = b.exam_popularity_rank;
    const aNull = ar == null || ar === '';
    const bNull = br == null || br === '';
    if (aNull && bNull) return String(a.name || '').localeCompare(String(b.name || ''));
    if (aNull) return 1;
    if (bNull) return -1;
    const an = Number(ar);
    const bn = Number(br);
    if (an !== bn) return an - bn;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });
}

/**
 * @param {object[]} streamExams exams_taxonomies rows for user's stream
 * @param {number[]} userInterestIds normalized career goal / interest ids
 * @param {object[]} streamMappings rows from StreamInterestRecommendation.findByStream
 * @returns {number[]} up to TOP_N exam ids, highest score first
 */
function computeRecommendedExamIdsTop20(streamExams, userInterestIds, streamMappings) {
  const normalized = userInterestIds
    .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
    .filter((id) => Number.isInteger(id));
  const totalT = normalized.length;
  const mappingsByInterest = buildMappingsByInterest(streamMappings, normalized);

  const scored = streamExams.map((exam) => {
    const id = Number(exam.id);
    const k = countInterestMatchesForExam(id, normalized, mappingsByInterest);
    const score = dashboardRecommendationFinalScore(exam, k, totalT);
    return { id, score, exam };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const ar = a.exam.exam_popularity_rank;
    const br = b.exam.exam_popularity_rank;
    const aNull = ar == null || ar === '';
    const bNull = br == null || br === '';
    if (aNull && bNull) return String(a.exam.name || '').localeCompare(String(b.exam.name || ''));
    if (aNull) return 1;
    if (bNull) return -1;
    return Number(ar) - Number(br);
  });

  const out = [];
  const seen = new Set();
  for (const row of scored) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row.id);
    if (out.length >= TOP_N) break;
  }
  return out;
}

/**
 * Dashboard "Recommended exams" tab: order exams using interest tags on exams
 * (exam_career_goal), overlap tiers, Default ("Any stream") vs stream-wise weights (33 / 25, renormalized),
 * stream relevance; ties broken by exam_popularity_rank then name.
 * exam_popularity_rank is not used as a primary sort here — only for tie-breaks (All / Shortlisted tabs sort by rank).
 *
 * Overlap = |user ∩ exam tags|. Tags come from exam_career_goal and/or admin
 * stream_interest_recommendation_mappings (Mapping → Recommended exams upload).
 * When every interest is on the Default stream only, weighted match caps at 75%.
 *
 * @param {object[]} exams Pool rows (exams_taxonomies)
 * @param {number[]} userInterestIds Up to student's chosen interests (e.g. 3)
 * @param {ReadonlyMap<number, number|null>} interestStreamById career_goals_taxonomies.stream_id per interest id
 * @param {number|null|undefined} defaultStreamId Streams row id for "Default"
 * @param {number} userStreamId Profile stream id
 * @param {ReadonlyMap<number, ReadonlySet<number>>} examTagsByExamId exam_id -> tagged career_goal_id set
 * @param {ReadonlyMap<number, number[]>} eligibilityStreamsByExamId exam_id -> ec.stream_ids
 * @returns {number[]} Ordered exam ids
 */
function computeDashboardRecommendedExamOrder(
  exams,
  userInterestIds,
  interestStreamById,
  defaultStreamId,
  userStreamId,
  examTagsByExamId,
  eligibilityStreamsByExamId
) {
  const uid = Number(userStreamId);
  const didRaw = defaultStreamId != null ? Number(defaultStreamId) : NaN;
  const hasDefaultStream = Number.isInteger(didRaw) && didRaw >= 1;

  const normalized = userInterestIds
    .map((id) => (typeof id === 'string' ? parseInt(id, 10) : id))
    .filter((id) => Number.isInteger(id));

  const allInterestsTaggedWithDefault =
    normalized.length > 0 &&
    hasDefaultStream &&
    normalized.every((id) => Number(interestStreamById.get(id)) === didRaw);

  /** @type {(tags: ReadonlySet<number>) => number} */
  function overlapCount(tags) {
    return normalized.filter((iid) => tags.has(iid)).length;
  }

  /** 33% stream-wise + 25% common (Default / "Any stream"), renormalized; all-Default interests → max 75%. */
  function blendedWeightedPct(tags) {
    const streamWiseInts = normalized.filter((iid) => Number(interestStreamById.get(iid)) === uid);
    const commonInts = normalized.filter(
      (iid) => hasDefaultStream && Number(interestStreamById.get(iid)) === didRaw
    );
    const pct = (hits, denom) => (denom > 0 ? (hits / denom) * 100 : 0);

    const matchSw = streamWiseInts.filter((iid) => tags.has(iid)).length;
    const matchCm = commonInts.filter((iid) => tags.has(iid)).length;

    const swScore = pct(matchSw, streamWiseInts.length);
    const cmScore = pct(matchCm, commonInts.length);

    if (allInterestsTaggedWithDefault && streamWiseInts.length === 0 && commonInts.length > 0) {
      return (cmScore * 75) / 100;
    }

    let wDenom = 0;
    let wNum = 0;
    if (streamWiseInts.length > 0) {
      wDenom += 33;
      wNum += 33 * swScore;
    }
    if (commonInts.length > 0) {
      wDenom += 25;
      wNum += 25 * cmScore;
    }
    if (wDenom <= 0) return 0;
    return wNum / wDenom;
  }

  /** Lower exam_popularity_rank = more popular (tie-break only for Recommended tab). */
  function comparePopularityRank(examA, examB) {
    const ar = examA.exam_popularity_rank;
    const br = examB.exam_popularity_rank;
    const aNull = ar == null || ar === '';
    const bNull = br == null || br === '';
    if (aNull && bNull) return 0;
    if (aNull) return 1;
    if (bNull) return -1;
    const an = Number(ar);
    const bn = Number(br);
    if (an !== bn) return an - bn;
    return 0;
  }

  /** Eligibility lists user's stream → higher relevance */
  function streamRelevant(eligStreams) {
    const arr = Array.isArray(eligStreams) ? eligStreams : [];
    return arr.map(Number).includes(uid);
  }

  const scored = exams.map((exam) => {
    const id = Number(exam.id);
    const tags = examTagsByExamId.get(id);
    /** @type {ReadonlySet<number>} */
    const tagSet =
      tags instanceof Set
        ? tags
        : new Set(tags != null ? Array.from(tags).map(Number) : []);
    const overlap = overlapCount(tagSet);
    const blended = blendedWeightedPct(tagSet);
    const elig = eligibilityStreamsByExamId.get(id) ?? [];
    const sr = streamRelevant(elig);
    return { id, overlap, blended, sr, exam };
  });

  scored.sort((a, b) => {
    if (b.overlap !== a.overlap) return b.overlap - a.overlap;
    if (a.sr !== b.sr) return a.sr ? -1 : 1;
    if (b.blended !== a.blended) return b.blended - a.blended;
    const pop = comparePopularityRank(a.exam, b.exam);
    if (pop !== 0) return pop;
    return String(a.exam.name || '').localeCompare(String(b.exam.name || ''));
  });

  const out = [];
  const seen = new Set();
  for (const row of scored) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(row.id);
  }
  return out;
}

module.exports = {
  TOP_N,
  getInterestDefaultWeights,
  popularityToDefaultScore,
  dashboardRecommendationFinalScore,
  buildExamTagsFromStreamInterestMappings,
  mergeExamTagMaps,
  collectMappedExamIdsForUserInterests,
  sortExamsByPopularityRank,
  computeRecommendedExamIdsTop20,
  computeDashboardRecommendedExamOrder,
};
