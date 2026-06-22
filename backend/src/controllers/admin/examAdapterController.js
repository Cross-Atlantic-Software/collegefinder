/**
 * Admin CRUD for ExamFill exam adapters.
 *
 * Endpoints (mounted at /api/admin/exam-adapters):
 *   GET    /                              List all adapters
 *   POST   /                              Register new exam stub
 *   GET    /profile-schema                Returns the profile schema (for the editor `source` dropdown)
 *   GET    /:examId                       Full config for editor
 *   PUT    /:examId                       Replace adapter config / metadata
 *   PATCH  /:examId/sections/:sectionId   Patch a single section
 *   PATCH  /:examId/status                Publish / unpublish
 *   DELETE /:examId                       Delete adapter row
 */

const db = require('../../config/database');
const { PROFILE_PATHS, isValidSource, refreshRegistryCache } = require('../../services/adapterBuilderService/profileSchema');

class ExamAdapterController {
  static async list(req, res) {
    try {
      const result = await db.query(
        `SELECT exam_id, exam_name, portal_url_pattern, status, version, is_active,
                is_ai_generated, last_verified_at, approval_status, approved_at,
                created_by, updated_by, created_at, updated_at,
                CASE WHEN adapter_config ? 'sections'
                     THEN jsonb_array_length(adapter_config->'sections')
                     ELSE 0 END AS section_count
           FROM exam_adapters
          ORDER BY exam_name`
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error listing exam adapters:', err);
      res.status(500).json({ success: false, message: 'Failed to list adapters' });
    }
  }

  static async getProfileSchema(req, res) {
    res.json({ success: true, data: PROFILE_PATHS });
  }

  static async getOne(req, res) {
    try {
      const { examId } = req.params;
      const result = await db.query(
        `SELECT a.exam_id, a.exam_name, a.portal_url_pattern, a.adapter_config, a.version,
                a.status, a.is_active, a.is_ai_generated, a.last_verified_at,
                a.approval_status, a.approved_at, a.approved_by,
                a.credit_cost, a.exam_fee,
                a.created_by, a.updated_by, a.created_at, a.updated_at,
                -- The application URL the admin "adds" lives on the catalog row,
                -- joined via the derived slug exactly as listCatalog computes it.
                -- Both columns are surfaced so the editor can mirror the catalog's
                -- COALESCE(registration_link, website) portal-link rule.
                t.registration_link,
                t.website
           FROM exam_adapters a
           LEFT JOIN exams_taxonomies t
             ON a.exam_id = btrim(regexp_replace(lower(COALESCE(NULLIF(t.code, ''), t.name)), '[^a-z0-9]+', '_', 'g'), '_')
          WHERE a.exam_id = $1`,
        [examId]
      );
      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }
      const row = result.rows[0];
      const cfg = typeof row.adapter_config === 'string' ? JSON.parse(row.adapter_config) : row.adapter_config;
      res.json({
        success: true,
        data: {
          ...row,
          adapter_config: cfg || { sections: [] }
        }
      });
    } catch (err) {
      console.error('Error fetching exam adapter:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch adapter' });
    }
  }

  static async create(req, res) {
    try {
      const { exam_id, exam_name, portal_url_pattern } = req.body || {};
      if (!exam_id || !exam_name || !portal_url_pattern) {
        return res.status(400).json({
          success: false,
          message: 'exam_id, exam_name and portal_url_pattern are required'
        });
      }
      const cleanId = String(exam_id).trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_');
      if (!cleanId) {
        return res.status(400).json({ success: false, message: 'exam_id must contain alphanumerics' });
      }

      const exists = await db.query('SELECT 1 FROM exam_adapters WHERE exam_id = $1', [cleanId]);
      if (exists.rows[0]) {
        return res.status(409).json({ success: false, message: `Adapter '${cleanId}' already exists` });
      }

      const created = await db.query(
        `INSERT INTO exam_adapters
           (exam_id, exam_name, portal_url_pattern, adapter_config, version,
            is_active, status, is_ai_generated, created_by, updated_by)
         VALUES ($1, $2, $3, $4::jsonb, 1, FALSE, 'draft', FALSE, $5, $5)
         RETURNING *`,
        [
          cleanId,
          String(exam_name).slice(0, 100),
          String(portal_url_pattern).slice(0, 200),
          JSON.stringify({ sections: [] }),
          req.admin?.email || null
        ]
      );
      res.status(201).json({ success: true, data: created.rows[0] });
    } catch (err) {
      console.error('Error creating exam adapter:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to create adapter' });
    }
  }

  static async update(req, res) {
    try {
      const { examId } = req.params;
      const { exam_name, portal_url_pattern, adapter_config, credit_cost, exam_fee } = req.body || {};

      const existing = await db.query(
        'SELECT exam_id, version FROM exam_adapters WHERE exam_id = $1',
        [examId]
      );
      if (!existing.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }

      const cleanedConfig = adapter_config ? sanitizeAdapterConfig(adapter_config) : null;
      const newVersion = (existing.rows[0].version || 0) + 1;

      const sets = [];
      const params = [];
      let i = 1;

      if (typeof exam_name === 'string') {
        sets.push(`exam_name = $${i++}`); params.push(exam_name.slice(0, 100));
      }
      if (typeof portal_url_pattern === 'string') {
        sets.push(`portal_url_pattern = $${i++}`); params.push(portal_url_pattern.slice(0, 200));
      }
      if (cleanedConfig) {
        sets.push(`adapter_config = $${i++}::jsonb`); params.push(JSON.stringify(cleanedConfig));
        sets.push(`version = $${i++}`); params.push(newVersion);
      }
      if (credit_cost !== undefined && credit_cost !== null && credit_cost !== '') {
        sets.push(`credit_cost = $${i++}`); params.push(parseInt(credit_cost, 10));
      }
      if (exam_fee !== undefined) {
        // Allow clearing the fee back to NULL with an empty value.
        sets.push(`exam_fee = $${i++}`);
        params.push(exam_fee === null || exam_fee === '' ? null : Number(exam_fee));
      }
      sets.push(`updated_by = $${i++}`); params.push(req.admin?.email || null);
      sets.push(`updated_at = CURRENT_TIMESTAMP`);

      if (sets.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      params.push(examId);
      const result = await db.query(
        `UPDATE exam_adapters SET ${sets.join(', ')} WHERE exam_id = $${i} RETURNING *`,
        params
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error updating exam adapter:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to update adapter' });
    }
  }

  static async patchSection(req, res) {
    try {
      const { examId, sectionId } = req.params;
      const { section } = req.body || {};
      if (!section || typeof section !== 'object') {
        return res.status(400).json({ success: false, message: 'section payload is required' });
      }

      const existing = await db.query(
        'SELECT adapter_config, version FROM exam_adapters WHERE exam_id = $1',
        [examId]
      );
      if (!existing.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }

      const cfg = parseConfig(existing.rows[0].adapter_config);
      const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
      const idx = sections.findIndex((s) => s && s.section_id === sectionId);

      const cleanedSection = sanitizeSection(section);
      cleanedSection.section_id = sectionId; // freeze id from URL

      if (idx >= 0) sections[idx] = cleanedSection;
      else sections.push(cleanedSection);

      cfg.sections = sections;
      const newVersion = (existing.rows[0].version || 0) + 1;

      const result = await db.query(
        `UPDATE exam_adapters
            SET adapter_config = $1::jsonb,
                version = $2,
                updated_by = $3,
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $4
        RETURNING *`,
        [JSON.stringify(cfg), newVersion, req.admin?.email || null, examId]
      );
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error patching section:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to patch section' });
    }
  }

  static async patchStatus(req, res) {
    try {
      const { examId } = req.params;
      const { status } = req.body || {};
      if (status !== 'draft' && status !== 'published') {
        return res.status(400).json({ success: false, message: 'status must be "draft" or "published"' });
      }
      const isActive = status === 'published';
      const result = await db.query(
        `UPDATE exam_adapters
            SET status = $1,
                is_active = $2,
                last_verified_at = CASE WHEN $2 THEN CURRENT_TIMESTAMP ELSE last_verified_at END,
                last_verified_by = CASE WHEN $2 THEN $3 ELSE last_verified_by END,
                updated_by = $3,
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $4
        RETURNING *`,
        [status, isActive, req.admin?.email || null, examId]
      );
      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error patching status:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to update status' });
    }
  }

  static async remove(req, res) {
    try {
      const { examId } = req.params;
      const result = await db.query(
        'DELETE FROM exam_adapters WHERE exam_id = $1 RETURNING exam_id',
        [examId]
      );
      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }
      res.json({ success: true, data: { exam_id: result.rows[0].exam_id } });
    } catch (err) {
      console.error('Error deleting adapter:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to delete adapter' });
    }
  }

  // ─── Admin validation & approval ─────────────────────────────────────────

  /**
   * GET /:examId/validation — the per-section feed for the review screen.
   *
   * Returns the LATEST validation-run fill report per section. These reports are
   * written by the extension running in admin-validation mode (validation_run =
   * TRUE), so this read is admin-gated and intentionally NOT owner-scoped (the
   * admin CMS identity differs from the extension user who ran the fill).
   */
  static async getValidationFeed(req, res) {
    try {
      const { examId } = req.params;
      const result = await db.query(
        `SELECT DISTINCT ON (section_name)
                section_name, field_results, adapter_version, created_at
           FROM fill_reports
          WHERE exam_id = $1 AND validation_run = TRUE
          ORDER BY section_name, created_at DESC`,
        [examId]
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error fetching validation feed:', err);
      res.status(500).json({ success: false, message: 'Failed to fetch validation feed' });
    }
  }

  /** POST /:examId/submit-review — mark a validation run as started. */
  static async submitReview(req, res) {
    try {
      const { examId } = req.params;
      const result = await db.query(
        `UPDATE exam_adapters
            SET approval_status = 'in_review',
                updated_by = $1,
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $2
            AND approval_status <> 'approved'
        RETURNING *`,
        [req.admin?.email || null, examId]
      );
      // Re-runnable: an already-approved adapter stays approved (no row returned),
      // which is the locked behaviour — never revert approval on a re-run.
      if (!result.rows[0]) {
        const existing = await db.query('SELECT * FROM exam_adapters WHERE exam_id = $1', [examId]);
        if (!existing.rows[0]) {
          return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
        }
        return res.json({ success: true, data: existing.rows[0] });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error submitting review:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to submit review' });
    }
  }

  /**
   * POST /:examId/approve — the "Approved" button.
   * Sets the approval lifecycle to approved AND publishes the adapter so the
   * extension can load it for students (getAdapter filters on is_active).
   */
  static async approve(req, res) {
    try {
      const { examId } = req.params;
      const result = await db.query(
        `UPDATE exam_adapters
            SET approval_status = 'approved',
                approved_at = CURRENT_TIMESTAMP,
                approved_by = $1,
                status = 'published',
                is_active = TRUE,
                last_verified_at = CURRENT_TIMESTAMP,
                last_verified_by = $1,
                updated_by = $1,
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $2
        RETURNING *`,
        [req.admin?.email || null, examId]
      );
      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: `Adapter '${examId}' not found` });
      }
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error approving adapter:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to approve adapter' });
    }
  }

  // ─── Discovered-field approval queue ──────────────────────────────────────

  /** GET /discovered-fields?status=pending — list discovered registry rows. */
  static async listDiscoveredFields(req, res) {
    try {
      const status = typeof req.query.status === 'string' ? req.query.status : 'pending';
      const result = await db.query(
        `SELECT id, field_path, type, label, status,
                discovered_from_exam, discovered_label, discovered_page_url,
                reviewed_by, reviewed_at, created_at, updated_at
           FROM profile_field_registry
          WHERE status = $1
          ORDER BY created_at DESC`,
        [status]
      );
      res.json({ success: true, data: result.rows });
    } catch (err) {
      console.error('Error listing discovered fields:', err);
      res.status(500).json({ success: false, message: 'Failed to list discovered fields' });
    }
  }

  /**
   * POST /discovered-fields — admin adds a profile field from the review screen.
   * Inserts a PENDING profile_field_registry row (mirrors the extension's auto-
   * capture). It then appears in the existing discovered-fields queue; approving
   * it there runs refreshRegistryCache() and adds it to the source whitelist.
   * Body: { label, type?, discovered_from_exam?, discovered_page_url? }.
   */
  static async createDiscoveredField(req, res) {
    try {
      const { label, type, discovered_from_exam, discovered_page_url } = req.body || {};
      const cleanLabel = typeof label === 'string' ? label.trim() : '';
      if (!cleanLabel) {
        return res.status(400).json({ success: false, message: 'label is required' });
      }
      const slug = snake(cleanLabel);
      if (!slug) {
        return res.status(400).json({ success: false, message: 'label must contain alphanumerics' });
      }
      const fieldPath = `discovered.${slug}`;
      const REGISTRY_TYPES = new Set(['text', 'select', 'date', 'radio', 'checkbox', 'file']);
      const cleanType = REGISTRY_TYPES.has(type) ? type : 'text';

      const inserted = await db.query(
        `INSERT INTO profile_field_registry
           (field_path, type, label, status, discovered_from_exam, discovered_label, discovered_page_url)
         VALUES ($1, $2, $3, 'pending', $4, $5, $6)
         ON CONFLICT (field_path) DO NOTHING
         RETURNING *`,
        [
          fieldPath,
          cleanType,
          cleanLabel.slice(0, 200),
          typeof discovered_from_exam === 'string' ? discovered_from_exam.slice(0, 100) : null,
          cleanLabel.slice(0, 300),
          typeof discovered_page_url === 'string' ? discovered_page_url.slice(0, 500) : null
        ]
      );
      if (!inserted.rows[0]) {
        const existing = await db.query(
          'SELECT * FROM profile_field_registry WHERE field_path = $1',
          [fieldPath]
        );
        return res.json({
          success: true,
          data: existing.rows[0],
          message: 'A field with this path is already in the queue'
        });
      }
      res.status(201).json({ success: true, data: inserted.rows[0] });
    } catch (err) {
      console.error('Error creating discovered field:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to add field' });
    }
  }

  /** PATCH /discovered-fields/:id — body { action: 'approve' | 'reject' }. */
  static async reviewDiscoveredField(req, res) {
    try {
      const { id } = req.params;
      const { action } = req.body || {};
      if (action !== 'approve' && action !== 'reject') {
        return res.status(400).json({ success: false, message: 'action must be "approve" or "reject"' });
      }
      const status = action === 'approve' ? 'approved' : 'rejected';
      const result = await db.query(
        `UPDATE profile_field_registry
            SET status = $1,
                reviewed_by = $2,
                reviewed_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        RETURNING *`,
        [status, req.admin?.email || null, id]
      );
      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: `Discovered field '${id}' not found` });
      }
      // Refresh the whitelist cache so the change takes effect immediately.
      await refreshRegistryCache();
      res.json({ success: true, data: result.rows[0] });
    } catch (err) {
      console.error('Error reviewing discovered field:', err);
      res.status(500).json({ success: false, message: err.message || 'Failed to review discovered field' });
    }
  }
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function parseConfig(cfg) {
  if (!cfg) return { sections: [] };
  if (typeof cfg === 'string') {
    try { return JSON.parse(cfg) || { sections: [] }; }
    catch { return { sections: [] }; }
  }
  return cfg;
}

function sanitizeAdapterConfig(cfg) {
  const obj = parseConfig(cfg);
  const sections = Array.isArray(obj.sections) ? obj.sections.map(sanitizeSection) : [];
  return { ...obj, sections };
}

const ALLOWED_TYPES = new Set(['text', 'select', 'date', 'radio', 'checkbox', 'file', 'select_or_text', 'text_or_select']);
const ALLOWED_FORMATS = new Set(['UPPERCASE', 'TITLECASE', 'PHONE', 'digits_only']);

function sanitizeSection(section) {
  if (!section || typeof section !== 'object') return null;
  const out = {
    section_id: snake(section.section_id) || `section_${Date.now()}`,
    section_name: String(section.section_name || 'Untitled').slice(0, 100),
    page_indicator: sanitizePageIndicator(section.page_indicator),
    fields: Array.isArray(section.fields)
      ? section.fields.map(sanitizeField).filter(Boolean)
      : []
  };
  return out;
}

function sanitizePageIndicator(pi) {
  const allowed = new Set(['url_contains', 'page_text_contains', 'step_number']);
  if (pi && allowed.has(pi.type)) {
    const value = pi.type === 'step_number' ? Number(pi.value) || 1 : String(pi.value || '').slice(0, 200);
    return { type: pi.type, value };
  }
  return null;
}

function sanitizeField(f) {
  if (!f || typeof f !== 'object') return null;
  const source = typeof f.source === 'string' ? f.source.trim() : '';
  // Allow saving fields that admin manually authored even if source temporarily blank;
  // but if source is provided, validate it. Drop only when source is non-empty AND invalid.
  if (source && !isValidSource(source)) return null;

  const type = ALLOWED_TYPES.has(f.type) ? f.type : 'text';
  const out = {
    field_id: snake(f.field_id) || snake(f.label) || `field_${Date.now()}`,
    label: String(f.label || '').slice(0, 200),
    source: source || null,
    type,
    required: !!f.required,
    selectors: sanitizeSelectors(f.selectors)
  };

  if (typeof f.format === 'string' && ALLOWED_FORMATS.has(f.format)) out.format = f.format;
  if ((type === 'select' || type === 'radio') && f.value_map && typeof f.value_map === 'object') {
    out.value_map = sanitizeValueMap(f.value_map);
  }
  if (type === 'date' && f.date_config && typeof f.date_config === 'object') {
    const variant = f.date_config.variant === 'masked_text' ? 'masked_text' : 'text';
    const format = typeof f.date_config.format === 'string' ? f.date_config.format.slice(0, 20) : 'DD/MM/YYYY';
    out.date_config = { variant, format };
  }
  if (type === 'file' && Array.isArray(f.accepted_types)) {
    out.accepted_types = f.accepted_types
      .filter((t) => typeof t === 'string')
      .slice(0, 6)
      .map((t) => t.slice(0, 60));
  }
  if (typeof f.cascade_dependency === 'string' && f.cascade_dependency.trim()) {
    out.cascade_dependency = f.cascade_dependency.trim().slice(0, 60);
  }
  if (typeof f.cascade_wait_ms === 'number' && Number.isFinite(f.cascade_wait_ms)) {
    out.cascade_wait_ms = Math.max(0, Math.min(10000, Math.floor(f.cascade_wait_ms)));
  }
  // Admin "Leave Blank" (Captcha/OTP/etc.): the filler short-circuits these to
  // 'skipped' so they never attempt a selector and never block approval.
  if (f.leave_blank === true) out.leave_blank = true;
  return out;
}

function sanitizeSelectors(selectors) {
  const out = {};
  if (!selectors || typeof selectors !== 'object') return out;
  for (const key of ['by_id', 'by_name', 'by_placeholder', 'by_label']) {
    if (Array.isArray(selectors[key])) {
      const cleaned = selectors[key]
        .filter((v) => typeof v === 'string' && v.trim())
        .map((v) => v.trim().slice(0, 120))
        .slice(0, 12);
      if (cleaned.length) out[key] = Array.from(new Set(cleaned));
    }
  }
  if (typeof selectors.by_index === 'number' && Number.isInteger(selectors.by_index) && selectors.by_index >= 0) {
    out.by_index = selectors.by_index;
  }
  return out;
}

function sanitizeValueMap(vm) {
  const out = {};
  for (const [canonical, variants] of Object.entries(vm)) {
    if (typeof canonical !== 'string' || !canonical.trim()) continue;
    if (!Array.isArray(variants)) continue;
    const cleaned = variants
      .filter((v) => typeof v === 'string' && v.trim())
      .map((v) => v.trim().slice(0, 80))
      .slice(0, 25);
    if (cleaned.length) out[canonical.trim()] = Array.from(new Set(cleaned));
  }
  return out;
}

function snake(s) {
  if (!s || typeof s !== 'string') return '';
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

module.exports = ExamAdapterController;
