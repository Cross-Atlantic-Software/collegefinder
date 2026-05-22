const { matchesExamSearchTokens } = require('./examSearchTokens');

function scholarshipSearchHaystack(scholarship) {
  const examLabels = (scholarship.linkedExams || []).flatMap((e) => [e.name, e.code]);
  const collegeLabels = (scholarship.linkedColleges || []).flatMap((c) => [
    c.name,
    c.city,
    c.state,
  ]);
  return [
    scholarship.scholarship_name,
    scholarship.conducting_authority,
    scholarship.scholarship_type,
    scholarship.description,
    scholarship.scholarship_amount,
    scholarship.mode,
    scholarship.stream_name,
    scholarship.official_website,
    scholarship.application_link,
    scholarship.official_notification_link,
    scholarship.academic_year,
    scholarship.eligible_degree,
    scholarship.education_level,
    scholarship.scope,
    ...examLabels,
    ...collegeLabels,
  ];
}

/**
 * Filter scholarships (already in display order) by search tokens.
 * @param {object[]} scholarships — rows with linkedExams / linkedColleges when available
 * @param {string} searchRaw
 */
function filterScholarshipsBySearch(scholarships, searchRaw) {
  const q = String(searchRaw || '').trim();
  if (!q) return scholarships;

  return scholarships.filter((sch) =>
    matchesExamSearchTokens(scholarshipSearchHaystack(sch), q)
  );
}

module.exports = { filterScholarshipsBySearch, scholarshipSearchHaystack };
