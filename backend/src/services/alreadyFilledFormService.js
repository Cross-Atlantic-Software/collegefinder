/**
 * Mark exams as already filled (outside automation) and sync shortlist + applications.
 */
const { pool } = require('../config/database');
const UserAcademics = require('../models/user/UserAcademics');
const Exam = require('../models/taxonomy/Exam');

function normalizeExamIdArray(raw) {
  if (!Array.isArray(raw)) return [];
  return [...new Set(raw.map((n) => Number(n)).filter((n) => Number.isInteger(n) && n > 0))].sort(
    (a, b) => a - b
  );
}

function slugFromTaxonomyCode(code) {
  if (!code || typeof code !== 'string') return null;
  return code
    .trim()
    .toLowerCase()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function findAutomationExamIdForTaxonomy(taxonomyExamId) {
  const exam = await Exam.findById(taxonomyExamId);
  if (!exam) return null;

  const slug = slugFromTaxonomyCode(exam.code);
  if (slug) {
    const bySlug = await pool.query(
      'SELECT id FROM automation_exams WHERE LOWER(slug) = LOWER($1) AND is_active = TRUE LIMIT 1',
      [slug]
    );
    if (bySlug.rows.length > 0) return bySlug.rows[0].id;
  }

  const byName = await pool.query(
    'SELECT id FROM automation_exams WHERE LOWER(name) = LOWER($1) AND is_active = TRUE LIMIT 1',
    [exam.name]
  );
  if (byName.rows.length > 0) return byName.rows[0].id;
  return null;
}

async function ensureAutomationApplicationCompleted(userId, taxonomyExamId) {
  const automationExamId = await findAutomationExamIdForTaxonomy(taxonomyExamId);
  if (!automationExamId) return;

  const existing = await pool.query(
    `SELECT id, status FROM automation_applications
     WHERE user_id = $1 AND exam_id = $2
     ORDER BY created_at DESC LIMIT 1`,
    [userId, automationExamId]
  );

  if (existing.rows.length > 0) {
    const row = existing.rows[0];
    if (row.status !== 'completed') {
      await pool.query(
        `UPDATE automation_applications SET status = 'completed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [row.id]
      );
    }
    return;
  }

  await pool.query(
    `INSERT INTO automation_applications (user_id, exam_id, status, created_at)
     VALUES ($1, $2, 'completed', CURRENT_TIMESTAMP)`,
    [userId, automationExamId]
  );
}

async function getAlreadyFilledFormExamIds(userId) {
  const academics = await UserAcademics.findByUserId(userId);
  return normalizeExamIdArray(academics?.already_filled_form);
}

async function setExamAlreadyFilled(userId, examId, filled) {
  const taxonomyExamId = Number(examId);
  if (!Number.isInteger(taxonomyExamId) || taxonomyExamId < 1) {
    throw new Error('INVALID_EXAM_ID');
  }

  const exam = await Exam.findById(taxonomyExamId);
  if (!exam) {
    throw new Error('EXAM_NOT_FOUND');
  }

  const existing = await UserAcademics.findByUserId(userId);
  const filledSet = new Set(normalizeExamIdArray(existing?.already_filled_form));
  const shortlistSet = new Set(normalizeExamIdArray(existing?.user_shortlisted_exams));

  if (filled) {
    filledSet.add(taxonomyExamId);
    shortlistSet.add(taxonomyExamId);
  } else {
    filledSet.delete(taxonomyExamId);
  }

  const already_filled_form = [...filledSet].sort((a, b) => a - b);
  const user_shortlisted_exams = [...shortlistSet].sort((a, b) => a - b);

  await UserAcademics.upsert(userId, { already_filled_form, user_shortlisted_exams });

  if (filled) {
    await ensureAutomationApplicationCompleted(userId, taxonomyExamId);
  }

  return {
    alreadyFilledFormExamIds: already_filled_form,
    shortlistedExamIds: user_shortlisted_exams,
  };
}

async function buildSyntheticCompletedApplications(userId, dbApplications) {
  const filledIds = await getAlreadyFilledFormExamIds(userId);
  if (filledIds.length === 0) return [];

  const taxonomyRows = await pool.query(
    `SELECT id, name, code FROM exams_taxonomies WHERE id = ANY($1::int[])`,
    [filledIds]
  );
  const taxonomyById = new Map(taxonomyRows.rows.map((r) => [Number(r.id), r]));

  const automationExamIdsInApps = new Set(
    dbApplications.map((a) => Number(a.exam_id)).filter((n) => Number.isInteger(n) && n > 0)
  );

  const synthetics = [];
  for (const taxonomyId of filledIds) {
    const taxonomy = taxonomyById.get(taxonomyId);
    if (!taxonomy) continue;

    const automationExamId = await findAutomationExamIdForTaxonomy(taxonomyId);
    if (automationExamId && automationExamIdsInApps.has(automationExamId)) {
      const hasCompleted = dbApplications.some(
        (a) => Number(a.exam_id) === automationExamId && a.status === 'completed'
      );
      if (hasCompleted) continue;
    }

    synthetics.push({
      id: -taxonomyId,
      user_id: userId,
      exam_id: taxonomyId,
      exam_name: taxonomy.name,
      exam_slug: taxonomy.code ? slugFromTaxonomyCode(taxonomy.code) : String(taxonomyId),
      exam_url: null,
      status: 'completed',
      session_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      source: 'already_filled_form',
    });
  }

  return synthetics;
}

module.exports = {
  normalizeExamIdArray,
  getAlreadyFilledFormExamIds,
  setExamAlreadyFilled,
  buildSyntheticCompletedApplications,
};
