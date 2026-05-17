const db = require('../../config/database');

class FillReportController {
  /**
   * POST /api/extension/fill-report
   * Logs the result of a fill attempt for analytics and debugging.
   */
  static async submitReport(req, res) {
    try {
      const userId = req.user.id;
      const { exam_id, section, adapter_version, results } = req.body;

      if (!exam_id || !section || !results) {
        return res.status(400).json({
          success: false,
          message: 'exam_id, section, and results are required'
        });
      }

      const summary = {
        filled: 0,
        check: 0,
        failed: 0,
        not_found: 0,
        total: results.length
      };

      for (const r of results) {
        if (r.status === 'filled') summary.filled++;
        else if (r.status === 'check') summary.check++;
        else if (r.status === 'failed') summary.failed++;
        else if (r.status === 'not_found') summary.not_found++;
      }

      await db.query(
        `INSERT INTO fill_reports
         (user_id, exam_id, section_name, total_fields, filled_count, check_count, failed_count, field_results, adapter_version)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
        [
          userId,
          exam_id,
          section,
          summary.total,
          summary.filled,
          summary.check,
          summary.failed + summary.not_found,
          JSON.stringify(results),
          adapter_version || 1
        ]
      );

      res.json({ success: true, summary });
    } catch (error) {
      console.error('Error saving fill report:', error);
      res.status(500).json({ success: false, message: 'Failed to save fill report' });
    }
  }

  /**
   * GET /api/extension/fill-reports
   * Get fill reports for the current user (recent).
   */
  static async getReports(req, res) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT id, exam_id, section_name, total_fields, filled_count, check_count, failed_count, adapter_version, created_at
         FROM fill_reports
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 50`,
        [userId]
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching fill reports:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch reports' });
    }
  }
}

module.exports = FillReportController;
