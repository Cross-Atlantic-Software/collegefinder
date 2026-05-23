const { normalizeCity, compareAlphabeticalByName } = require('../utils/dashboardMetricSort');

function getOverlapScore(scholarship) {
  const examN = Number(scholarship.linkedExamCount) || 0;
  const collegeN = Number(scholarship.linkedCollegeCount) || 0;
  return examN + collegeN;
}

function cityMatchFromLinkedColleges(scholarship, userCityNorm) {
  if (!userCityNorm || !scholarship.linkedColleges?.length) return 0;
  return scholarship.linkedColleges.some(
    (c) => normalizeCity(c.city) && normalizeCity(c.city) === userCityNorm
  )
    ? 1
    : 0;
}

function examCollegeTierForScholarship(
  scholarship,
  shortlistedExamSet,
  recommendedExamSet,
  shortlistedCollegeSet,
  recommendedCollegeSet
) {
  const examIds = (scholarship.linkedExams || []).map((e) => Number(e.id));
  const collegeIds = (scholarship.linkedColleges || []).map((c) => Number(c.id));

  if (
    examIds.some((id) => shortlistedExamSet.has(id)) ||
    collegeIds.some((id) => shortlistedCollegeSet.has(id))
  ) {
    return 0;
  }
  if (
    examIds.some((id) => recommendedExamSet.has(id)) ||
    collegeIds.some((id) => recommendedCollegeSet.has(id))
  ) {
    return 1;
  }
  return 2;
}

function compareScholarshipRanking(a, b, userCityNorm, useTiers) {
  if (useTiers) {
    const tierDiff = (a._sortTier ?? 2) - (b._sortTier ?? 2);
    if (tierDiff !== 0) return tierDiff;
  }

  const overlapDiff = getOverlapScore(b) - getOverlapScore(a);
  if (overlapDiff !== 0) return overlapDiff;

  const cityDiff = cityMatchFromLinkedColleges(b, userCityNorm) - cityMatchFromLinkedColleges(a, userCityNorm);
  if (cityDiff !== 0) return cityDiff;

  return compareAlphabeticalByName(a, b, 'scholarship_name');
}

function annotateScholarshipTiers(scholarships, ctx) {
  const shortlistedExamSet = new Set((ctx.shortlistedExamIds || []).map(Number));
  const recommendedExamSet = new Set((ctx.recommendedExamIds || []).map(Number));
  const shortlistedCollegeSet = new Set((ctx.shortlistedCollegeIds || []).map(Number));
  const recommendedCollegeSet = new Set((ctx.recommendedCollegeIds || []).map(Number));

  return scholarships.map((sch) => ({
    ...sch,
    _sortTier: examCollegeTierForScholarship(
      sch,
      shortlistedExamSet,
      recommendedExamSet,
      shortlistedCollegeSet,
      recommendedCollegeSet
    ),
  }));
}

function sortAllScholarships(scholarships, userCity) {
  const userCityNorm = normalizeCity(userCity);
  return [...scholarships]
    .sort((a, b) => compareScholarshipRanking(a, b, userCityNorm, false))
    .map(stripSortMeta);
}

function sortRecommendedScholarships(scholarships, ctx) {
  const userCityNorm = normalizeCity(ctx.userCity);
  const withTiers = annotateScholarshipTiers(scholarships, ctx);
  return [...withTiers]
    .sort((a, b) => compareScholarshipRanking(a, b, userCityNorm, true))
    .map(stripSortMeta);
}

function sortShortlistedScholarships(scholarships, ctx) {
  if (!ctx.shortlistedExamIds.length && !ctx.shortlistedCollegeIds.length) {
    return [...scholarships].sort((a, b) =>
      compareAlphabeticalByName(a, b, 'scholarship_name')
    );
  }
  return sortRecommendedScholarships(scholarships, ctx);
}

function stripSortMeta(sch) {
  const { _sortTier, ...rest } = sch;
  return rest;
}

module.exports = {
  sortAllScholarships,
  sortRecommendedScholarships,
  sortShortlistedScholarships,
};
