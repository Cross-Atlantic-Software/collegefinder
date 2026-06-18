/**
 * Dashboard journey planner dates.
 * Phase 1–2: recommended + shortlisted exams (examsController).
 * Phase 3, 5, 6 & 7: automation_applications exams → exam_dates fields.
 */
const { pool } = require('../config/database');
const ExamDates = require('../models/exam/ExamDates');
const { syncAlreadyFilledAutomationApplications } = require('./alreadyFilledFormService');
const { normalizeExamDateIso } = require('../utils/examDateUtils');

async function findTaxonomyExamIdForAutomation(automationExamId, automationName, automationSlug) {
  if (automationSlug) {
    const slug = String(automationSlug).trim().toLowerCase();
    const bySlug = await pool.query(
      `SELECT et.id, et.name
       FROM exams_taxonomies et
       WHERE LOWER(REPLACE(et.code, '_', '-')) = $1
          OR LOWER(et.code) = REPLACE($1, '-', '_')
       LIMIT 1`,
      [slug]
    );
    if (bySlug.rows.length > 0) return bySlug.rows[0];
  }

  if (automationName) {
    const byName = await pool.query(
      'SELECT id, name FROM exams_taxonomies WHERE LOWER(name) = LOWER($1) LIMIT 1',
      [automationName]
    );
    if (byName.rows.length > 0) return byName.rows[0];
  }

  if (automationExamId) {
    const autoRow = await pool.query(
      'SELECT name, slug FROM automation_exams WHERE id = $1 LIMIT 1',
      [automationExamId]
    );
    if (autoRow.rows.length > 0) {
      return findTaxonomyExamIdForAutomation(
        null,
        autoRow.rows[0].name,
        autoRow.rows[0].slug
      );
    }
  }

  return null;
}

async function loadApplicationExamTaxonomyMap(userId) {
  await syncAlreadyFilledAutomationApplications(userId);

  const appsResult = await pool.query(
    `SELECT DISTINCT ON (aa.exam_id)
       aa.exam_id,
       e.name AS exam_name,
       e.slug AS exam_slug
     FROM automation_applications aa
     LEFT JOIN automation_exams e ON aa.exam_id = e.id
     WHERE aa.user_id = $1
     ORDER BY aa.exam_id, aa.created_at DESC`,
    [userId]
  );

  const taxonomyById = new Map();
  for (const row of appsResult.rows) {
    const taxonomy = await findTaxonomyExamIdForAutomation(
      row.exam_id,
      row.exam_name,
      row.exam_slug
    );
    if (taxonomy) {
      taxonomyById.set(Number(taxonomy.id), taxonomy.name || row.exam_name || `Exam ${taxonomy.id}`);
    }
  }

  return taxonomyById;
}

async function loadApplicationExamDateItems(userId, dateColumn, valueKey) {
  const taxonomyById = await loadApplicationExamTaxonomyMap(userId);
  if (taxonomyById.size === 0) return [];

  const datesRows = await ExamDates.findByExamIds([...taxonomyById.keys()]);
  const dateMap = new Map(datesRows.map((d) => [Number(d.exam_id), d]));

  const items = [];
  for (const [examId, examName] of taxonomyById.entries()) {
    const raw = dateMap.get(examId)?.[dateColumn];
    const normalized = normalizeExamDateIso(raw);
    if (!normalized) continue;
    items.push({
      examId,
      examName,
      [valueKey]: normalized,
    });
  }

  items.sort((a, b) => a[valueKey].localeCompare(b[valueKey]));
  return items;
}

/** Taxonomy exam IDs with a completed row in automation_applications for this user. */
async function loadAutomationCompletedTaxonomyExamIds(userId) {
  await syncAlreadyFilledAutomationApplications(userId);

  const appsResult = await pool.query(
    `SELECT DISTINCT ON (aa.exam_id)
       aa.exam_id,
       e.name AS exam_name,
       e.slug AS exam_slug
     FROM automation_applications aa
     LEFT JOIN automation_exams e ON aa.exam_id = e.id
     WHERE aa.user_id = $1 AND aa.status = 'completed'
     ORDER BY aa.exam_id, aa.created_at DESC`,
    [userId]
  );

  const taxonomyIds = [];
  for (const row of appsResult.rows) {
    const taxonomy = await findTaxonomyExamIdForAutomation(
      row.exam_id,
      row.exam_name,
      row.exam_slug
    );
    if (taxonomy?.id) {
      taxonomyIds.push(Number(taxonomy.id));
    }
  }

  return [...new Set(taxonomyIds.filter((id) => Number.isInteger(id) && id > 0))];
}

/** Phase 3 — admit_card_date from automation_applications exams. */
async function loadPhase3AdmitCardDatesForUser(userId) {
  return loadApplicationExamDateItems(userId, 'admit_card_date', 'admitCardDate');
}

/** Phase 5 — exam_date from automation_applications exams. */
async function loadPhase5ExamDatesForUser(userId) {
  return loadApplicationExamDateItems(userId, 'exam_date', 'examDate');
}

/** Phase 6 — result_date from automation_applications exams. */
async function loadPhase6ResultDatesForUser(userId) {
  return loadApplicationExamDateItems(userId, 'result_date', 'resultDate');
}

/** Phase 7 — counselling_start_date from automation_applications exams (legacy counselling_date fallback). */
async function loadPhase7CounsellingDatesForUser(userId) {
  const taxonomyById = await loadApplicationExamTaxonomyMap(userId);
  if (taxonomyById.size === 0) return [];

  const datesRows = await ExamDates.findByExamIds([...taxonomyById.keys()]);
  const dateMap = new Map(datesRows.map((d) => [Number(d.exam_id), d]));

  const items = [];
  for (const [examId, examName] of taxonomyById.entries()) {
    const row = dateMap.get(examId);
    const normalized = normalizeExamDateIso(row?.counselling_start_date ?? row?.counselling_date);
    if (!normalized) continue;
    items.push({
      examId,
      examName,
      counsellingDate: normalized,
    });
  }

  items.sort((a, b) => a.counsellingDate.localeCompare(b.counsellingDate));
  return items;
}

module.exports = {
  loadPhase3AdmitCardDatesForUser,
  loadPhase5ExamDatesForUser,
  loadPhase6ResultDatesForUser,
  loadPhase7CounsellingDatesForUser,
  findTaxonomyExamIdForAutomation,
  loadApplicationExamTaxonomyMap,
  loadAutomationCompletedTaxonomyExamIds,
};
