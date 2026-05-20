const { matchesExamSearchTokens } = require('./examSearchTokens');

function collegeSearchHaystack(college, examLabels = []) {
  return [
    college.college_name,
    college.college_location,
    college.city,
    college.state,
    college.college_type,
    college.parent_university,
    college.website,
    ...examLabels,
  ];
}

/**
 * Filter colleges (already in display order) by search tokens.
 * @param {object[]} colleges
 * @param {string} searchRaw
 * @param {Map<number, string[]>} [examLabelsByCollegeId] optional exam names/codes per college
 */
function filterCollegesBySearch(colleges, searchRaw, examLabelsByCollegeId = null) {
  const q = String(searchRaw || '').trim();
  if (!q) return colleges;

  return colleges.filter((c) => {
    const labels = examLabelsByCollegeId?.get(c.id) || [];
    return matchesExamSearchTokens(collegeSearchHaystack(c, labels), q);
  });
}

module.exports = { filterCollegesBySearch, collegeSearchHaystack };
