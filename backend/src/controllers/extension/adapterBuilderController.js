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

      if (!section.fields || section.fields.length === 0) {
        return res.status(422).json({
          success: false,
          message: 'AI could not map any fields on this page. Check that the page has a registration form visible.'
        });
      }

      // Merge into adapter_config.sections (replace same section_id, else append)
      const cfg = normaliseConfig(examRow.adapter_config);
      const sections = Array.isArray(cfg.sections) ? cfg.sections : [];
      const existingIdx = sections.findIndex((s) => s && s.section_id === section.section_id);
      if (existingIdx >= 0) sections[existingIdx] = section;
      else sections.push(section);

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
