const db = require('../../config/database');

/**
 * FillReportController
 *
 * The fill_reports table is the UniTracko audit trail required by the spec's
 * "User Verification & Transparency" section. Each row records, for one section
 * fill: the form (exam_id + section_name), the information submitted
 * (field_results — label + value + status per field), the changes the student
 * made on the pre-fill review screen (student_changes), their confirmation
 * (confirmed_at), and the timestamp (created_at).
 */
class FillReportController {
  /**
   * POST /api/extension/fill-report
   * Records the result of a fill attempt as an audit entry.
   *
   * Body: { exam_id, section, adapter_version, results,
   *         student_changes?, confirmed_at? }
   *   - results: [{ field_id, label, status, value, note }]
   *   - student_changes: diff from the review screen (optional — only present
   *     when the student went through review/edit)
   *   - confirmed_at: ISO timestamp of the student's "Confirm & Fill" click
   *     (optional — absent for non-reviewed fills, e.g. the admin builder)
   */
  static async submitReport(req, res) {
    try {
      const userId = req.user.id;
      const {
        exam_id,
        section,
        adapter_version,
        results,
        student_changes, // optional
        confirmed_at     // optional (ISO string)
      } = req.body;

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

      const inserted = await db.query(
        `INSERT INTO fill_reports
         (user_id, exam_id, section_name, total_fields, filled_count, check_count,
          failed_count, field_results, adapter_version, student_changes, confirmed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9, $10::jsonb, $11)
         RETURNING id, created_at`,
        [
          userId,
          exam_id,
          section,
          summary.total,
          summary.filled,
          summary.check,
          summary.failed + summary.not_found,
          JSON.stringify(results),
          adapter_version || 1,
          // store the diff only when present; null otherwise
          student_changes ? JSON.stringify(student_changes) : null,
          confirmed_at || null
        ]
      );

      res.json({ success: true, summary, id: inserted.rows[0].id, created_at: inserted.rows[0].created_at });
    } catch (error) {
      console.error('Error saving fill report:', error);
      res.status(500).json({ success: false, message: 'Failed to save fill report' });
    }
  }

  /**
   * GET /api/extension/fill-reports
   * List the current user's audit entries (most recent first).
   * Lightweight: summary columns only. confirmed_at lets the UI flag which
   * submissions the student explicitly reviewed and confirmed.
   */
  static async getReports(req, res) {
    try {
      const userId = req.user.id;

      const result = await db.query(
        `SELECT id, exam_id, section_name, total_fields, filled_count,
                check_count, failed_count, adapter_version, confirmed_at, created_at,
                (student_changes IS NOT NULL) AS has_changes
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

  /**
   * GET /api/extension/fill-reports/:id
   * Full audit detail for one entry: every field submitted (label + value +
   * status), the student's changes, their confirmation, and the timestamp.
   *
   * Scoped to the owner — a student can only read their own reports. (Admin-wide
   * access belongs in the admin panel and is a separate, admin-gated route.)
   */
  static async getReportDetail(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await db.query(
        `SELECT id, user_id, exam_id, section_name, total_fields, filled_count,
                check_count, failed_count, field_results, student_changes,
                confirmed_at, adapter_version, created_at
           FROM fill_reports
          WHERE id = $1 AND user_id = $2`,
        [id, userId]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching fill report detail:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch report' });
    }
  }

  /**
   * GET /api/admin/fill-reports
   * List submissions across ALL students (admin). Optional ?exam_id=&user_id=&limit=&offset=
   */
  static async adminGetReports(req, res) {
    try {
      const { exam_id, user_id, limit = 50, offset = 0 } = req.query;

      const where = [];
      const values = [];
      if (exam_id) { values.push(exam_id); where.push(`fr.exam_id = $${values.length}`); }
      if (user_id) { values.push(parseInt(user_id, 10)); where.push(`fr.user_id = $${values.length}`); }
      const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

      values.push(parseInt(limit, 10));
      const limIdx = values.length;
      values.push(parseInt(offset, 10));
      const offIdx = values.length;

      const result = await db.query(
        `SELECT fr.id, fr.user_id, fr.exam_id, fr.section_name, fr.total_fields,
                fr.filled_count, fr.check_count, fr.failed_count, fr.adapter_version,
                fr.confirmed_at, fr.created_at,
                (fr.student_changes IS NOT NULL) AS has_changes,
                u.name  AS user_name,
                u.email AS user_email
           FROM fill_reports fr
           LEFT JOIN users u ON u.id = fr.user_id
           ${whereClause}
          ORDER BY fr.created_at DESC
          LIMIT $${limIdx} OFFSET $${offIdx}`,
        values
      );

      res.json({ success: true, data: result.rows });
    } catch (error) {
      console.error('Error fetching admin fill reports:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
  }

  /**
   * GET /api/admin/fill-reports/:id
   * Full submission detail for any student (admin).
   */
  static async adminGetReportDetail(req, res) {
    try {
      const { id } = req.params;
      const result = await db.query(
        `SELECT fr.id, fr.user_id, fr.exam_id, fr.section_name, fr.total_fields,
                fr.filled_count, fr.check_count, fr.failed_count, fr.field_results,
                fr.student_changes, fr.confirmed_at, fr.adapter_version, fr.created_at,
                u.name AS user_name, u.email AS user_email, u.phone_number AS user_phone
           FROM fill_reports fr
           LEFT JOIN users u ON u.id = fr.user_id
          WHERE fr.id = $1`,
        [id]
      );

      if (!result.rows[0]) {
        return res.status(404).json({ success: false, message: 'Report not found' });
      }

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('Error fetching admin fill report detail:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch submission' });
    }
  }
}

module.exports = FillReportController;
