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

module.exports = {
  TOP_N,
  getInterestDefaultWeights,
  popularityToDefaultScore,
  dashboardRecommendationFinalScore,
  sortExamsByPopularityRank,
  computeRecommendedExamIdsTop20,
};
