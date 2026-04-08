const db = require('../../config/database');

class AdaptersController {
  /**
   * GET /api/extension/adapters/:examId
   * Returns the adapter config JSON for a specific exam.
   */
  static async getAdapter(req, res) {
    try {
      const { examId } = req.params;

      const result = await db.query(
        `SELECT exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, last_verified_at
         FROM exam_adapters
         WHERE exam_id = $1 AND is_active = TRUE`,
        [examId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({
          success: false,
          message: `Adapter not found for exam: ${examId}`
        });
      }

      const row = result.rows[0];
      const adapterConfig = typeof row.adapter_config === 'string'
        ? JSON.parse(row.adapter_config)
        : row.adapter_config;

      res.json({
        success: true,
        data: {
          exam_id: row.exam_id,
          exam_name: row.exam_name,
          portal_url_pattern: row.portal_url_pattern,
          version: row.version,
          is_active: row.is_active,
          last_verified_at: row.last_verified_at,
          ...adapterConfig
        }
      });
    } catch (error) {
      console.error('Error fetching adapter:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch adapter' });
    }
  }

  /**
   * GET /api/extension/adapters/detect?url=...
   * Detects which exam an open URL belongs to.
   */
  static async detectExam(req, res) {
    try {
      const url = req.query.url;
      if (!url) {
        return res.status(400).json({ success: false, message: 'url query parameter required' });
      }

      const result = await db.query(
        `SELECT exam_id, exam_name, version, is_active
         FROM exam_adapters
         WHERE is_active = TRUE AND $1 LIKE '%' || portal_url_pattern || '%'`,
        [url]
      );

      if (!result.rows[0]) {
        return res.json({ success: true, detected: false });
      }

      const row = result.rows[0];
      res.json({
        success: true,
        detected: true,
        exam_id: row.exam_id,
        exam_name: row.exam_name,
        is_active: row.is_active,
        adapter_version: row.version
      });
    } catch (error) {
      console.error('Error detecting exam:', error);
      res.status(500).json({ success: false, message: 'Failed to detect exam' });
    }
  }

  /**
   * GET /api/extension/adapters
   * List all active adapters (for admin / debug).
   */
  static async listAdapters(req, res) {
    try {
      const result = await db.query(
        `SELECT exam_id, exam_name, portal_url_pattern, version, is_active, last_verified_at, updated_at
         FROM exam_adapters
         WHERE is_active = TRUE
         ORDER BY exam_name`
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error listing adapters:', error);
      res.status(500).json({ success: false, message: 'Failed to list adapters' });
    }
  }
}

module.exports = AdaptersController;
