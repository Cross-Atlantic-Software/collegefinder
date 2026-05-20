const db = require('../config/database');
const { bumpDashboardCollegeSortCacheVersion } = require('./dashboardCollegeSortCache');

/**
 * Recompute distinct exam link count for one college (college + program level).
 */
async function refreshLinkedExamCountForCollege(collegeId) {
  const id = parseInt(collegeId, 10);
  if (!Number.isInteger(id) || id < 1) return 0;

  const result = await db.query(
    `UPDATE colleges
     SET linked_exam_count = COALESCE((
       SELECT COUNT(DISTINCT exam_id)::int
       FROM (
         SELECT exam_id
         FROM college_recommended_exams
         WHERE college_id = $1
         UNION
         SELECT btrim(tok.raw)::int AS exam_id
         FROM college_programs cp
         CROSS JOIN LATERAL unnest(string_to_array(cp.recommended_exam_ids, ',')) AS tok(raw)
         WHERE cp.college_id = $1
           AND cp.recommended_exam_ids IS NOT NULL
           AND btrim(cp.recommended_exam_ids) <> ''
           AND btrim(tok.raw) ~ '^[0-9]+$'
       ) AS links
     ), 0),
     updated_at = CURRENT_TIMESTAMP
     WHERE id = $1
     RETURNING linked_exam_count`,
    [id]
  );

  bumpDashboardCollegeSortCacheVersion();
  return result.rows[0]?.linked_exam_count ?? 0;
}

/** Refresh counts for many colleges (e.g. after bulk import). */
async function refreshLinkedExamCountForColleges(collegeIds) {
  const ids = [...new Set(collegeIds.map((x) => parseInt(x, 10)).filter((n) => Number.isInteger(n) && n > 0))];
  for (const id of ids) {
    await refreshLinkedExamCountForCollege(id);
  }
}

module.exports = {
  refreshLinkedExamCountForCollege,
  refreshLinkedExamCountForColleges,
};
