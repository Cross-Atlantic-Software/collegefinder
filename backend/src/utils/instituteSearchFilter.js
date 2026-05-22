const { matchesExamSearchTokens } = require('./examSearchTokens');

function instituteSearchHaystack(institute, examLabels = []) {
  return [
    institute.institute_name,
    institute.institute_location,
    institute.city,
    institute.state,
    institute.institute_cityname,
    institute.type,
    institute.website,
    institute.branches_number,
    institute.student_strength,
    ...examLabels,
  ];
}

/**
 * Filter coaching institutes (already in display order) by search tokens.
 * @param {object[]} institutes
 * @param {string} searchRaw
 * @param {Map<number, string[]>} [examLabelsByInstituteId]
 */
function filterInstitutesBySearch(institutes, searchRaw, examLabelsByInstituteId = null) {
  const q = String(searchRaw || '').trim();
  if (!q) return institutes;

  return institutes.filter((inst) => {
    const labels = examLabelsByInstituteId?.get(inst.id) || [];
    return matchesExamSearchTokens(instituteSearchHaystack(inst, labels), q);
  });
}

module.exports = { filterInstitutesBySearch, instituteSearchHaystack };
