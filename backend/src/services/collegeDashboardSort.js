/**
 * Dashboard college shortlist ordering (All / Recommended / Shortlisted tabs).
 */

function normalizeCity(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function compareAlphabetical(a, b) {
  return String(a.college_name ?? '').localeCompare(String(b.college_name ?? ''), 'en', {
    sensitivity: 'base',
  });
}

function getLinkCount(college) {
  const n = Number(college.linked_exam_count);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Higher exam link count, then same city as user (college must have city), then A–Z. */
function compareLinkCountCityAlpha(a, b, userCityNorm) {
  const overlapDiff = getLinkCount(b) - getLinkCount(a);
  if (overlapDiff !== 0) return overlapDiff;

  const aCity = normalizeCity(a.city);
  const bCity = normalizeCity(b.city);
  const aMatch = userCityNorm && aCity && aCity === userCityNorm ? 1 : 0;
  const bMatch = userCityNorm && bCity && bCity === userCityNorm ? 1 : 0;
  if (bMatch !== aMatch) return bMatch - aMatch;

  return compareAlphabetical(a, b);
}

function examTierForCollege(collegeId, examIdsMap, shortlistedSet, recommendedSet) {
  const examIds = examIdsMap.get(collegeId) || [];
  if (examIds.some((id) => shortlistedSet.has(id))) return 0;
  if (examIds.some((id) => recommendedSet.has(id))) return 1;
  return 2;
}

/**
 * All Colleges: linked_exam_count → same city → alphabetical.
 */
function sortAllColleges(colleges, userCity) {
  const userCityNorm = normalizeCity(userCity);
  return [...colleges].sort((a, b) => compareLinkCountCityAlpha(a, b, userCityNorm));
}

/**
 * Recommended: shortlisted-exam colleges → recommended-only → link count → city → A–Z.
 */
function sortRecommendedColleges(
  colleges,
  userCity,
  shortlistedExamIds,
  recommendedExamIds,
  examIdsMap
) {
  const userCityNorm = normalizeCity(userCity);
  const shortlistedSet = new Set(shortlistedExamIds.map(Number));
  const recommendedSet = new Set(recommendedExamIds.map(Number));

  return [...colleges].sort((a, b) => {
    const tierDiff =
      examTierForCollege(a.id, examIdsMap, shortlistedSet, recommendedSet) -
      examTierForCollege(b.id, examIdsMap, shortlistedSet, recommendedSet);
    if (tierDiff !== 0) return tierDiff;
    return compareLinkCountCityAlpha(a, b, userCityNorm);
  });
}

/**
 * Shortlisted colleges only.
 * No shortlisted exams → A–Z only.
 * With shortlisted exams → exam tiers then link count → city → A–Z.
 */
function sortShortlistedColleges(
  colleges,
  userCity,
  shortlistedExamIds,
  recommendedExamIds,
  examIdsMap
) {
  if (!shortlistedExamIds.length) {
    return [...colleges].sort(compareAlphabetical);
  }

  return sortRecommendedColleges(
    colleges,
    userCity,
    shortlistedExamIds,
    recommendedExamIds,
    examIdsMap
  );
}

module.exports = {
  sortAllColleges,
  sortRecommendedColleges,
  sortShortlistedColleges,
};
