/**
 * Exam Prep self-study: filter lectures by tagged exams (shortlisted + recommended)
 * and assign exam-match tier for ordering.
 */

function parseExamIds(raw) {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [];
  return arr.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0);
}

function resolveExamPoolIds(shortlistedExamIds, recommendedExamIds) {
  return [
    ...new Set(
      [...(shortlistedExamIds || []), ...(recommendedExamIds || [])]
        .map(Number)
        .filter((id) => Number.isInteger(id) && id > 0)
    ),
  ];
}

function examTierForLecture(examIds, shortlistedSet, recommendedSet) {
  if (examIds.some((id) => shortlistedSet.has(id))) return 0;
  if (examIds.some((id) => recommendedSet.has(id))) return 1;
  return 2;
}

/**
 * Tag lectures with exam-match tier for ordering.
 * All stream-matched lectures are kept visible; tier 0/1 sort above untagged (tier 2).
 */
function filterExamPrepLectureRows(rows, ctx) {
  const shortlistedSet = new Set((ctx.shortlistedExamIds || []).map(Number));
  const recommendedSet = new Set((ctx.recommendedExamIds || []).map(Number));

  return rows.map((row) => {
    const examIds = parseExamIds(row.exam_ids);
    return {
      ...row,
      exam_ids: examIds,
      exam_tier: examTierForLecture(examIds, shortlistedSet, recommendedSet),
    };
  });
}

function compareExamPrepLectures(a, b) {
  const tierDiff = (a.exam_tier ?? 2) - (b.exam_tier ?? 2);
  if (tierDiff !== 0) return tierDiff;

  const rankDiff = Number(b.rank_score ?? 0) - Number(a.rank_score ?? 0);
  if (rankDiff !== 0) return rankDiff;

  const aTime = a.updated_at ? new Date(a.updated_at).getTime() : 0;
  const bTime = b.updated_at ? new Date(b.updated_at).getTime() : 0;
  return bTime - aTime;
}

function sortExamPrepLectureRows(rows) {
  return [...rows].sort(compareExamPrepLectures);
}

module.exports = {
  filterExamPrepLectureRows,
  sortExamPrepLectureRows,
  resolveExamPoolIds,
};
