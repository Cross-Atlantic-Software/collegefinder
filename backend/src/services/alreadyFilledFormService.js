/**
 * Mark exams as already filled (outside automation) and sync shortlist + automation_applications.
 */
const { pool } = require('../config/database');
const UserAcademics = require('../models/user/UserAcademics');
const Exam = require('../models/taxonomy/Exam');

const ALREADY_FILLED_ADMIN_NOTE = 'already_filled_form';

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
      'SELECT id FROM automation_exams WHERE LOWER(slug) = LOWER($1) LIMIT 1',
      [slug]
    );
    if (bySlug.rows.length > 0) return bySlug.rows[0].id;
  }

  const byName = await pool.query(
    'SELECT id FROM automation_exams WHERE LOWER(name) = LOWER($1) LIMIT 1',
    [exam.name]
  );
  if (byName.rows.length > 0) return byName.rows[0].id;
  return null;
}

async function resolveUniqueAutomationSlug(baseSlug, taxonomyExamId) {
  const root = baseSlug || `exam-${taxonomyExamId}`;
  let slug = root;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const check = await pool.query('SELECT id FROM automation_exams WHERE LOWER(slug) = LOWER($1)', [
      slug,
    ]);
    if (check.rows.length === 0) return slug;
    slug = `${root}-${taxonomyExamId}`;
    if (attempt > 0) slug = `${root}-${taxonomyExamId}-${attempt + 1}`;
  }
  return `exam-${taxonomyExamId}-${Date.now()}`;
}

/**
 * Ensure an automation_exams row exists for a catalog exam (creates inactive stub when missing).
 */
async function ensureAutomationExamForTaxonomy(taxonomyExamId) {
  const existingId = await findAutomationExamIdForTaxonomy(taxonomyExamId);
  if (existingId) return existingId;

  const exam = await Exam.findById(taxonomyExamId);
  if (!exam) return null;

  const baseSlug = slugFromTaxonomyCode(exam.code);
  const slug = await resolveUniqueAutomationSlug(baseSlug, taxonomyExamId);
  const url =
    typeof exam.website === 'string' && exam.website.trim()
      ? exam.website.trim()
      : `https://collegefinder.local/exams/${slug}`;

  const defaultAgentConfig = {
    max_retries: 3,
    screenshot_interval_ms: 1000,
    human_intervention_timeout_seconds: 300,
    success_patterns: [],
    error_patterns: [],
    captcha: {
      auto_solve_enabled: false,
      provider: 'manual',
      timeout_seconds: 30,
    },
  };

  const result = await pool.query(
    `INSERT INTO automation_exams (
       name, slug, url, is_active, taxonomy_exam_id, field_mappings, agent_config
     ) VALUES ($1, $2, $3, TRUE, $4, '{}'::jsonb, $5::jsonb)
     RETURNING id`,
    [exam.name, slug, url, taxonomyExamId, JSON.stringify(defaultAgentConfig)]
  );

  return result.rows[0]?.id ?? null;
}

/**
 * Resolve (or create) an automation_exams row for a student Apply action.
 * Ensures taxonomy link + active row so applications persist after refresh.
 */
async function resolveAutomationExamForStudentApply(taxonomyExamId) {
  const tid = Number(taxonomyExamId);
  if (!Number.isInteger(tid) || tid <= 0) return null;

  const exam = await Exam.findById(tid);
  if (!exam) return null;

  const byLink = await pool.query(
    'SELECT id FROM automation_exams WHERE taxonomy_exam_id = $1 ORDER BY is_active DESC, id ASC LIMIT 1',
    [tid]
  );
  if (byLink.rows[0]?.id) {
    const automationId = Number(byLink.rows[0].id);
    await pool.query(
      `UPDATE automation_exams
       SET is_active = TRUE,
           taxonomy_exam_id = $1,
           name = COALESCE(NULLIF(TRIM(name), ''), $2),
           url = COALESCE(NULLIF(TRIM(url), ''), $3)
       WHERE id = $4`,
      [
        tid,
        exam.name,
        typeof exam.website === 'string' && exam.website.trim() ? exam.website.trim() : null,
        automationId,
      ]
    );
    return automationId;
  }

  const matched = await findAutomationExamIdForTaxonomy(tid);
  if (matched) {
    await pool.query(
      `UPDATE automation_exams
       SET is_active = TRUE,
           taxonomy_exam_id = $1,
           name = COALESCE(NULLIF(TRIM(name), ''), $2),
           url = COALESCE(NULLIF(TRIM(url), ''), $3)
       WHERE id = $4`,
      [
        tid,
        exam.name,
        typeof exam.registration_link === 'string' && exam.registration_link.trim()
          ? exam.registration_link.trim()
          : typeof exam.website === 'string' && exam.website.trim()
            ? exam.website.trim()
            : null,
        matched,
      ]
    );
    return matched;
  }

  return ensureAutomationExamForTaxonomy(tid);
}

async function ensureAutomationApplicationCompleted(userId, taxonomyExamId) {
  const automationExamId = await ensureAutomationExamForTaxonomy(taxonomyExamId);
  if (!automationExamId) return;

  const existing = await pool.query(
    `SELECT id, status, admin_notes
     FROM automation_applications
     WHERE user_id = $1 AND exam_id = $2
     ORDER BY created_at DESC`,
    [userId, automationExamId]
  );

  const completedRow = existing.rows.find((row) => row.status === 'completed');
  if (completedRow) {
    if (completedRow.admin_notes !== ALREADY_FILLED_ADMIN_NOTE) {
      await pool.query(
        `UPDATE automation_applications
         SET admin_notes = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [ALREADY_FILLED_ADMIN_NOTE, completedRow.id]
      );
    }
    return;
  }

  const activeRow = existing.rows.find((row) =>
    ['pending', 'approved', 'running', 'failed'].includes(row.status)
  );
  if (activeRow) {
    await pool.query(
      `UPDATE automation_applications
       SET status = 'completed', admin_notes = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [ALREADY_FILLED_ADMIN_NOTE, activeRow.id]
    );
    return;
  }

  await pool.query(
    `INSERT INTO automation_applications (user_id, exam_id, status, admin_notes, created_at)
     VALUES ($1, $2, 'completed', $3, CURRENT_TIMESTAMP)`,
    [userId, automationExamId, ALREADY_FILLED_ADMIN_NOTE]
  );
}

async function syncAlreadyFilledAutomationApplications(userId) {
  const filledIds = await getAlreadyFilledFormExamIds(userId);
  for (const taxonomyId of filledIds) {
    await ensureAutomationApplicationCompleted(userId, taxonomyId);
  }
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

function mapApplicationSource(row) {
  if (row?.admin_notes === ALREADY_FILLED_ADMIN_NOTE || row?.source === 'already_filled_form') {
    return 'already_filled_form';
  }
  return undefined;
}

module.exports = {
  normalizeExamIdArray,
  getAlreadyFilledFormExamIds,
  setExamAlreadyFilled,
  ensureAutomationExamForTaxonomy,
  ensureAutomationApplicationCompleted,
  syncAlreadyFilledAutomationApplications,
  mapApplicationSource,
  findAutomationExamIdForTaxonomy,
  resolveAutomationExamForStudentApply,
  ALREADY_FILLED_ADMIN_NOTE,
};
