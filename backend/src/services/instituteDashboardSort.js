const {
  normalizeCity,
  parseMetricSortValue,
  compareAlphabeticalByName,
} = require('../utils/dashboardMetricSort');

function isOnlineDelivery(type) {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'online' || t === 'hybrid';
}

function isOfflineDelivery(type) {
  const t = String(type ?? '').trim().toLowerCase();
  return t === 'offline' || t === 'hybrid';
}

function filterByDelivery(institutes, delivery) {
  if (delivery === 'online') {
    return institutes.filter((i) => isOnlineDelivery(i.type));
  }
  return institutes.filter((i) => isOfflineDelivery(i.type));
}

/**
 * Tier 0 = form-filled exam link, 1 = shortlisted, 2 = recommended only, 3 = other in pool.
 */
function examTierForInstitute(
  instituteId,
  examIdsMap,
  formFilledSet,
  shortlistedSet,
  recommendedSet
) {
  const examIds = examIdsMap.get(instituteId) || [];
  if (formFilledSet.size && examIds.some((id) => formFilledSet.has(id))) return 0;
  if (shortlistedSet.size && examIds.some((id) => shortlistedSet.has(id))) return 1;
  if (recommendedSet.size && examIds.some((id) => recommendedSet.has(id))) return 2;
  return 3;
}

function cityMatchScore(institute, userCityNorm) {
  if (!userCityNorm) return 0;
  const city = normalizeCity(institute.city);
  return city && city === userCityNorm ? 1 : 0;
}

function compareInstituteMetrics(a, b, userCityNorm, useCity) {
  const tierDiff = (a._sortTier ?? 3) - (b._sortTier ?? 3);
  if (tierDiff !== 0) return tierDiff;

  const branchesDiff =
    parseMetricSortValue(b.branches_number) - parseMetricSortValue(a.branches_number);
  if (branchesDiff !== 0) return branchesDiff;

  const strengthDiff =
    parseMetricSortValue(b.student_strength) - parseMetricSortValue(a.student_strength);
  if (strengthDiff !== 0) return strengthDiff;

  if (useCity) {
    const cityDiff = cityMatchScore(b, userCityNorm) - cityMatchScore(a, userCityNorm);
    if (cityDiff !== 0) return cityDiff;
  }

  return compareAlphabeticalByName(a, b);
}

function annotateTiers(institutes, examIdsMap, ctx) {
  const formFilledSet = new Set((ctx.formFilledExamIds || []).map(Number));
  const shortlistedSet = new Set((ctx.shortlistedExamIds || []).map(Number));
  const recommendedSet = new Set((ctx.recommendedExamIds || []).map(Number));
  return institutes.map((inst) => ({
    ...inst,
    _sortTier: examTierForInstitute(
      inst.id,
      examIdsMap,
      formFilledSet,
      shortlistedSet,
      recommendedSet
    ),
  }));
}

function stripSortMeta(inst) {
  const { _sortTier, ...rest } = inst;
  return rest;
}

/**
 * Sort institutes for one delivery tab (online or offline) per exam-activity rules.
 */
function sortDeliveryInstitutes(institutes, delivery, ctx, examIdsMap) {
  const userCityNorm = normalizeCity(ctx.userCity);
  const useCity = delivery === 'offline';
  const filtered = filterByDelivery(institutes, delivery);
  const withTiers = annotateTiers(filtered, examIdsMap, ctx);
  return [...withTiers]
    .sort((a, b) => compareInstituteMetrics(a, b, userCityNorm, useCity))
    .map(stripSortMeta);
}

/**
 * Shortlisted coaching institutes only.
 * No shortlisted exams → branches → strength → A–Z.
 * With shortlisted exams → exam tiers then same metric stack.
 */
function sortShortlistedInstitutes(
  institutes,
  ctx,
  examIdsMap
) {
  const userCityNorm = normalizeCity(ctx.userCity);
  if (!(ctx.shortlistedExamIds || []).length) {
    return [...institutes].sort((a, b) => {
      const branchesDiff =
        parseMetricSortValue(b.branches_number) - parseMetricSortValue(a.branches_number);
      if (branchesDiff !== 0) return branchesDiff;
      const strengthDiff =
        parseMetricSortValue(b.student_strength) - parseMetricSortValue(a.student_strength);
      if (strengthDiff !== 0) return strengthDiff;
      return compareAlphabeticalByName(a, b);
    });
  }

  const withTiers = annotateTiers(institutes, examIdsMap, ctx);
  return [...withTiers]
    .sort((a, b) => compareInstituteMetrics(a, b, userCityNorm, false))
    .map(stripSortMeta);
}

module.exports = {
  sortDeliveryInstitutes,
  sortShortlistedInstitutes,
  filterByDelivery,
  isOnlineDelivery,
  isOfflineDelivery,
};
