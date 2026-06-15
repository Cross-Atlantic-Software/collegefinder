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

  /**
   * GET /api/extension/fill-progress?exam_id=
   * Per-section status for the current user on one exam (latest report per
   * section). Powers "save & continue later": the sidebar hydrates its
   * sectionStates from this so completed sections survive across sessions.
   * Reuses the fill_reports audit trail — no new table.
   */
  static async getFillProgress(req, res) {
    try {
      const userId = req.user.id;
      const { exam_id } = req.query;
      if (!exam_id) {
        return res.status(400).json({ success: false, message: 'exam_id is required' });
      }

      // Latest report per section (DISTINCT ON keeps the newest by created_at).
      const result = await db.query(
        `SELECT DISTINCT ON (section_name)
                section_name, total_fields, filled_count, check_count, failed_count,
                confirmed_at, created_at
           FROM fill_reports
          WHERE user_id = $1 AND exam_id = $2
          ORDER BY section_name, created_at DESC`,
        [userId, exam_id]
      );

      // Mirror the sidebar's own status derivation so persisted state matches
      // in-session state. (failed_count already includes not_found.)
      const data = result.rows.map((r) => {
        let status = 'done';
        if (r.failed_count > 0) status = 'failed';
        else if (r.check_count > 0) status = 'check';
        return {
          section_id: r.section_name,
          status,
          confirmed: !!r.confirmed_at,
          summary: {
            filled: r.filled_count,
            check: r.check_count,
            failed: r.failed_count,
            not_found: 0, // folded into failed already — keep 0 to avoid double count
            total: r.total_fields,
          },
          last_filled_at: r.created_at,
        };
      });

      res.json({ success: true, data });
    } catch (error) {
      console.error('Error fetching fill progress:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch progress' });
    }
  }
}

module.exports = FillReportController;
