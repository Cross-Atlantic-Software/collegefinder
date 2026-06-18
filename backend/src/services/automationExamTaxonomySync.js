/**
 * Sync automation exam admin fields into exams_taxonomies + exam_dates.
 */
const { query } = require('../config/database');
const ExamDates = require('../models/exam/ExamDates');

function deriveMappingStatus(fieldMappings) {
  let fm = fieldMappings;
  if (typeof fm === 'string') {
    try {
      fm = JSON.parse(fm);
    } catch {
      return 'not_mapped';
    }
  }
  if (!fm || typeof fm !== 'object' || Array.isArray(fm)) return 'not_mapped';
  const keys = Object.keys(fm).filter((k) => k && k !== 'sections');
  if (keys.length === 0) return 'not_mapped';
  const hasNested = keys.some((k) => {
    const v = fm[k];
    return v && typeof v === 'object' && Object.keys(v).length > 0;
  });
  return hasNested || keys.length > 0 ? 'mapped' : 'not_mapped';
}

function normalizeDate(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!s) return null;
  return s.length >= 10 ? s.slice(0, 10) : s;
}

function normalizeFee(value) {
  if (value == null || value === '') return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) ? n : null;
}

function hasExamDetailsPayload(examDatesPayload) {
  if (!examDatesPayload || typeof examDatesPayload !== 'object') return false;
  const d = examDatesPayload;
  return Boolean(
    normalizeDate(d.application_start_date) ||
      normalizeDate(d.application_close_date) ||
      normalizeDate(d.admit_card_date) ||
      normalizeDate(d.exam_date) ||
      normalizeDate(d.result_date) ||
      normalizeDate(d.counselling_start_date) ||
      normalizeDate(d.counselling_end_date) ||
      normalizeDate(d.counselling_date) ||
      normalizeFee(d.application_fees) != null ||
      normalizeFee(d.ut_service_fee) != null
  );
}

/**
 * Resolve exams_taxonomies.id from explicit link, slug/code, or exact name.
 */
async function resolveTaxonomyExamIdForAutomation({ taxonomy_exam_id, name, slug }) {
  const explicit = taxonomy_exam_id != null && taxonomy_exam_id !== ''
    ? Number(taxonomy_exam_id)
    : null;
  if (Number.isInteger(explicit) && explicit > 0) return explicit;

  const slugNorm = slug ? String(slug).trim().toLowerCase() : '';
  const nameNorm = name ? String(name).trim().toLowerCase() : '';

  if (slugNorm) {
    const bySlug = await query(
      `SELECT id FROM exams_taxonomies
        WHERE LOWER(REPLACE(COALESCE(code, ''), '_', '-')) = $1
           OR LOWER(code) = REPLACE($1, '-', '_')
        ORDER BY id ASC
        LIMIT 1`,
      [slugNorm]
    );
    if (bySlug.rows[0]?.id) return Number(bySlug.rows[0].id);
  }

  if (nameNorm) {
    const byName = await query(
      `SELECT id FROM exams_taxonomies WHERE LOWER(TRIM(name)) = $1 ORDER BY id ASC LIMIT 1`,
      [nameNorm]
    );
    if (byName.rows[0]?.id) return Number(byName.rows[0].id);
  }

  return null;
}

async function syncTaxonomyFromAutomation({
  taxonomy_exam_id,
  name,
  registration_link,
  exam_dates: examDatesPayload,
}) {
  const taxonomyId = taxonomy_exam_id != null ? Number(taxonomy_exam_id) : null;
  if (!Number.isInteger(taxonomyId) || taxonomyId <= 0) return null;

  if (name || registration_link) {
    await query(
      `UPDATE exams_taxonomies
          SET name = COALESCE(NULLIF($2, ''), name),
              registration_link = COALESCE(NULLIF($3, ''), registration_link),
              website = COALESCE(NULLIF($3, ''), website),
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1`,
      [taxonomyId, name ? String(name).trim() : null, registration_link ? String(registration_link).trim() : null]
    );
  }

  if (!examDatesPayload || typeof examDatesPayload !== 'object') {
    return taxonomyId;
  }

  const d = examDatesPayload;
  const counsellingStart =
    normalizeDate(d.counselling_start_date) ?? normalizeDate(d.counselling_date);
  const counsellingEnd = normalizeDate(d.counselling_end_date);

  await ExamDates.upsert({
    exam_id: taxonomyId,
    application_start_date: normalizeDate(d.application_start_date),
    application_close_date: normalizeDate(d.application_close_date),
    admit_card_date: normalizeDate(d.admit_card_date),
    exam_date: normalizeDate(d.exam_date),
    result_date: normalizeDate(d.result_date),
    counselling_start_date: counsellingStart,
    counselling_end_date: counsellingEnd,
    counselling_date: counsellingStart,
    application_fees: normalizeFee(d.application_fees),
    ut_service_fee: normalizeFee(d.ut_service_fee),
  });

  return taxonomyId;
}

async function loadExamDatesForTaxonomy(taxonomyExamId) {
  const id = Number(taxonomyExamId);
  if (!Number.isInteger(id) || id <= 0) return null;
  return ExamDates.findByExamId(id);
}

module.exports = {
  deriveMappingStatus,
  syncTaxonomyFromAutomation,
  loadExamDatesForTaxonomy,
  resolveTaxonomyExamIdForAutomation,
  hasExamDetailsPayload,
  normalizeDate,
  normalizeFee,
};
