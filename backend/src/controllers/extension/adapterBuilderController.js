/**
 * AdapterBuilderController
 *
 * Endpoints for the Chrome extension's "Build Adapter" admin flow.
 *
 *   POST /api/extension/adapters/build
 *     Body: { exam_id, page: { url, title, headings, fields[] } }
 *     Returns the AI-generated section spec AND persists/merges it into
 *     `exam_adapters.adapter_config.sections[]` (replaces same section_id).
 *
 *   GET /api/extension/adapters/registered
 *     Returns lightweight list of every registered exam (regardless of status)
 *     so the extension knows which URL patterns to activate on.
 */

const db = require('../../config/database');
const { AdapterBuilderService } = require('../../services/adapterBuilderService/AdapterBuilderService');

const builderService = new AdapterBuilderService();

class AdapterBuilderController {
  /**
   * GET /api/extension/adapters/registered
   * Public to authenticated extension users. Returns id/name/url-pattern only;
   * never the full adapter_config (use /adapters/:examId for that).
   */
  static async listRegistered(req, res) {
    try {
      const result = await db.query(
        `SELECT exam_id, exam_name, portal_url_pattern, status, version, is_active,
                CASE WHEN status = 'published' AND is_active = TRUE THEN TRUE ELSE FALSE END AS has_published_adapter
         FROM exam_adapters
         ORDER BY exam_name`
      );
      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error listing registered exams:', error);
      res.status(500).json({ success: false, message: 'Failed to list registered exams' });
    }
  }

  /**
   * POST /api/extension/adapters/build
   * Body: { exam_id, page: { url, title, headings:[], fields:[{...}] } }
   * Auth: requires student JWT (authenticate) AND user.email matches an
   *       active admin row (requireExtensionAdmin).
   */
  static async buildSection(req, res) {
    try {
      const { exam_id, page } = req.body || {};
      if (!exam_id || typeof exam_id !== 'string') {
        return res.status(400).json({ success: false, message: 'exam_id is required' });
      }
      if (!page || typeof page !== 'object' || !Array.isArray(page.fields) || page.fields.length === 0) {
        return res.status(400).json({ success: false, message: 'page.fields[] is required and must be non-empty' });
      }

      // Load existing adapter row (must already be registered via CMS).
      const existing = await db.query(
        `SELECT exam_id, exam_name, portal_url_pattern, adapter_config, version
           FROM exam_adapters
          WHERE exam_id = $1`,
        [exam_id]
      );
      if (!existing.rows[0]) {
        return res.status(404).json({
          success: false,
          message: `Exam '${exam_id}' is not registered. Register it from the Form Adapters CMS first.`
        });
      }

      const examRow = existing.rows[0];
      if (!builderService.isAvailable()) {
        return res.status(503).json({
          success: false,
          message: 'AI service is not configured. Set GOOGLE_API_KEY in backend/.env and restart.'
        });
      }

      // Generate via Gemini
      const section = await builderService.generateSection({
        exam_name: examRow.exam_name,
        page
      });

      // Capture unmappable fields (DROP B) as pending registry rows for admin
      // approval, then strip the collector so it is never persisted/returned.
      const discovered = Array.isArray(section._discovered) ? section._discovered : [];
      delete section._discovered;
      if (discovered.length) {
        try {
          for (const d of discovered) {
            const slug = snakeLabel(d.label);
            if (!slug) continue;
            await db.query(
              `INSERT INTO profile_field_registry
                 (field_path, type, label, status, discovered_from_exam, discovered_label, discovered_page_url)
               VALUES ($1, $2, $3, 'pending', $4, $5, $6)
               ON CONFLICT (field_path) DO NOTHING`,
              [
                `discovered.${slug}`,
                d.type || 'text',
                d.label.slice(0, 200),
                examRow.exam_name || null,
                d.label.slice(0, 300),
                (page.url || '').slice(0, 500) || null
              ]
            );
          }
        } catch (capErr) {
          // Non-fatal: a capture failure must never fail the scan.
          console.warn(`⚠️  Discovered-field capture failed (non-fatal): ${capErr.message}`);
        }
      }

      if (!section.fields || section.fields.length === 0) {
        return res.status(422).json({
          success: false,
          message: 'AI could not map any fields on this page. Check that the page has a registration form visible.'
        });
      }

      // Merge into adapter_config.sections. Re-scans of the same page must
      // REPLACE in place rather than append. section_id is AI-generated and
      // unstable, so we match on the stable page URL (with a step-number guard),
      // and preserve the existing section_id on replace.
      const cfg = normaliseConfig(examRow.adapter_config);
      const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
      const matchIdx = findMatchingSectionIndex(sections, section);
      if (matchIdx >= 0) {
        section.section_id = sections[matchIdx].section_id; // keep stable identity
        sections[matchIdx] = section;
      } else {
        sections.push(section);
      }

      cfg.sections = sections;

      const newVersion = (examRow.version || 0) + 1;
      const updatedBy = req.adminFromExtension?.email || req.user?.email || null;

      await db.query(
        `UPDATE exam_adapters
            SET adapter_config = $1::jsonb,
                version = $2,
                is_ai_generated = TRUE,
                updated_by = $3,
                updated_at = CURRENT_TIMESTAMP
          WHERE exam_id = $4`,
        [JSON.stringify(cfg), newVersion, updatedBy, exam_id]
      );

      res.json({
        success: true,
        data: {
          exam_id,
          version: newVersion,
          section
        }
      });
    } catch (error) {
      console.error('Error building adapter section:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to build adapter section'
      });
    }
  }
}

// Derives a snake_case slug from a human form label for the `discovered.<slug>`
// field path (e.g. "Parent Mobile No." -> "parent_mobile_no"). Returns '' if empty.
// The slug is capped at 100 chars so `discovered.` + slug stays well under the
// profile_field_registry.field_path VARCHAR(150) limit (avoids silent Postgres
// truncation, which produced mid-word paths and ON CONFLICT collisions between
// distinct long labels). The cap is applied before the final trailing-underscore
// trim so the slice can never leave a path ending in `_`.
function snakeLabel(label) {
  if (typeof label !== 'string') return '';
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+/, '')
    .slice(0, 100)
    .replace(/_+$/, '');
}

// Match an incoming scan to an existing section.
//  1) exact section_id — backward compatible with adapters built before this change
//  2) same normalized page URL, with a step-number guard so single-URL multi-step
//     wizards (page_indicator.type === 'step_number') only match the same step.
function findMatchingSectionIndex(sections, incoming) {
  const byId = sections.findIndex((s) => s && s.section_id === incoming.section_id);
  if (byId >= 0) return byId;

  const url = incoming.page_url;
  if (!url) return -1;

  return sections.findIndex((s) => {
    if (!s || s.page_url !== url) return false;
    const a = s.page_indicator, b = incoming.page_indicator;
    const aStep = a && a.type === 'step_number' ? a.value : null;
    const bStep = b && b.type === 'step_number' ? b.value : null;
    if (aStep != null || bStep != null) return aStep === bStep;
    return true; // same URL, no step distinction → same section
  });
}

function normaliseConfig(adapter_config) {
  if (!adapter_config) return { sections: [] };
  if (typeof adapter_config === 'string') {
    try { return JSON.parse(adapter_config) || { sections: [] }; }
    catch { return { sections: [] }; }
  }
  if (typeof adapter_config !== 'object') return { sections: [] };
  return adapter_config;
}

module.exports = AdapterBuilderController;
