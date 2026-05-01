const db = require('../config/database');

class UploadJob {
  static async create(data) {
    const {
      module = 'lectures',
      file_path,
      thumbnails_zip_path = null,
      original_filename = null,
      total_rows = 0,
      created_by_admin_id = null,
    } = data;
    const r = await db.query(
      `INSERT INTO upload_jobs (module, file_path, thumbnails_zip_path, original_filename, total_rows, status, created_by_admin_id)
       VALUES ($1, $2, $3, $4, $5, 'pending', $6) RETURNING *`,
      [module, file_path, thumbnails_zip_path, original_filename, total_rows, created_by_admin_id]
    );
    return r.rows[0];
  }

  static async findById(id) {
    const r = await db.query('SELECT * FROM upload_jobs WHERE id = $1', [id]);
    return r.rows[0] || null;
  }

  static async update(id, patch) {
    const keys = Object.keys(patch).filter((k) => patch[k] !== undefined);
    if (keys.length === 0) return this.findById(id);
    const sets = keys.map((k, i) => `${k} = $${i + 2}`);
    const vals = keys.map((k) => patch[k]);
    const r = await db.query(
      `UPDATE upload_jobs SET ${sets.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      [id, ...vals]
    );
    return r.rows[0] || null;
  }

  static async incrementCounters(id, { processed_delta = 0, success_delta = 0, failed_delta = 0, hook_delta = 0 }) {
    const r = await db.query(
      `UPDATE upload_jobs SET
        processed_rows = processed_rows + $2,
        success_count = success_count + $3,
        failed_count = failed_count + $4,
        hook_summaries_queued = hook_summaries_queued + $5,
        cursor_row = cursor_row + $2,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 RETURNING *`,
      [id, processed_delta, success_delta, failed_delta, hook_delta]
    );
    return r.rows[0] || null;
  }

  /**
   * @param {{ lecture_id?: number|null, college_id?: number|null }} ids
   */
  static async insertRowResult(upload_job_id, row_number, status, ids, error_message) {
    const lecture_id = ids && ids.lecture_id != null ? ids.lecture_id : null;
    const college_id = ids && ids.college_id != null ? ids.college_id : null;
    await db.query(
      `INSERT INTO upload_job_rows (upload_job_id, row_number, lecture_id, college_id, status, error_message)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (upload_job_id, row_number) DO UPDATE SET
         lecture_id = EXCLUDED.lecture_id,
         college_id = EXCLUDED.college_id,
         status = EXCLUDED.status,
         error_message = EXCLUDED.error_message`,
      [upload_job_id, row_number, lecture_id, college_id, status, error_message]
    );
  }

  /** Jobs that still need a worker run (pending, or processing but stale — e.g. worker died). */
  static async findPendingOrStaleProcessing(module, staleMinutes = 60) {
    const r = await db.query(
      `SELECT * FROM upload_jobs
       WHERE module = $1
         AND (
           status = 'pending'
           OR (status = 'processing' AND updated_at < NOW() - ($2::integer * INTERVAL '1 minute'))
         )
       ORDER BY id ASC`,
      [module, staleMinutes]
    );
    return r.rows;
  }

  static async listFailedRowsForCsv(upload_job_id) {
    const r = await db.query(
      `SELECT row_number, error_message FROM upload_job_rows
       WHERE upload_job_id = $1 AND status = 'failed'
       ORDER BY row_number ASC`,
      [upload_job_id]
    );
    return r.rows;
  }
}

module.exports = UploadJob;
