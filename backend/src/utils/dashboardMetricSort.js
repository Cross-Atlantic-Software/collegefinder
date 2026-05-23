/**
 * Shared helpers for dashboard sorting (branches, student strength, city match).
 */

function normalizeCity(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

/** Parse free-text metrics (e.g. "5000+", "2 lakh", "10-12") for descending sort. */
function parseMetricSortValue(text) {
  if (text == null || text === '') return 0;
  const s = String(text).trim().toLowerCase();
  const lakhMatch = s.match(/([\d.]+)\s*lakh/);
  if (lakhMatch) {
    const n = parseFloat(lakhMatch[1]);
    return Number.isFinite(n) ? n * 100000 : 0;
  }
  const croreMatch = s.match(/([\d.]+)\s*crore/);
  if (croreMatch) {
    const n = parseFloat(croreMatch[1]);
    return Number.isFinite(n) ? n * 10000000 : 0;
  }
  const kMatch = s.match(/([\d.]+)\s*k\b/);
  if (kMatch) {
    const n = parseFloat(kMatch[1]);
    return Number.isFinite(n) ? n * 1000 : 0;
  }
  const nums = s.match(/[\d.]+/g);
  if (!nums || !nums.length) return 0;
  return Math.max(...nums.map((n) => parseFloat(n)).filter((n) => Number.isFinite(n)));
}

function compareAlphabeticalByName(a, b, nameKey = 'institute_name') {
  return String(a[nameKey] ?? '').localeCompare(String(b[nameKey] ?? ''), 'en', {
    sensitivity: 'base',
  });
}

module.exports = {
  normalizeCity,
  parseMetricSortValue,
  compareAlphabeticalByName,
};
