const Exam = require('../models/taxonomy/Exam');
const { splitList } = require('./bulkUploadUtils');

/**
 * Resolve a delimiter-separated list of exam names/codes to taxonomy IDs.
 * Tries exact name, code, then contains (same as institutes/scholarships bulk upload).
 */
async function resolveExamNamesToIds(namesStr) {
  if (namesStr == null) return { ids: [], unknown: [] };
  const names = splitList(namesStr);
  if (!names.length) return { ids: [], unknown: [] };

  const lowers = names.map((n) => n.trim().toLowerCase()).filter(Boolean);
  const exactMap = await Exam.findIdMapByExactNameOrCodeLowercase(lowers);

  const ids = [];
  const unknown = [];
  for (const nm of names) {
    const key = nm.trim().toLowerCase();
    if (!key) continue;
    if (exactMap.has(key)) {
      ids.push(exactMap.get(key));
      continue;
    }
    const ex = await Exam.findByNameContains(nm);
    if (ex) ids.push(ex.id);
    else unknown.push(nm);
  }
  return { ids, unknown };
}

module.exports = { resolveExamNamesToIds };
