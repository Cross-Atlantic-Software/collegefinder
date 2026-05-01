-- Async bulk upload job tracking (lectures module; extensible module column)
CREATE TABLE IF NOT EXISTS upload_jobs (
  id SERIAL PRIMARY KEY,
  module VARCHAR(64) NOT NULL DEFAULT 'lectures',
  status VARCHAR(32) NOT NULL DEFAULT 'pending',
  file_path TEXT NOT NULL,
  thumbnails_zip_path TEXT,
  original_filename VARCHAR(512),
  total_rows INT NOT NULL DEFAULT 0,
  processed_rows INT NOT NULL DEFAULT 0,
  success_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  cursor_row INT NOT NULL DEFAULT 0,
  hook_summaries_queued INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_by_admin_id INT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_upload_jobs_module_status ON upload_jobs(module, status);
CREATE INDEX IF NOT EXISTS idx_upload_jobs_created_at ON upload_jobs(created_at DESC);

DROP TRIGGER IF EXISTS update_upload_jobs_updated_at ON upload_jobs;
CREATE TRIGGER update_upload_jobs_updated_at BEFORE UPDATE ON upload_jobs
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE upload_jobs IS 'Background bulk Excel jobs; file_path points to temp upload on disk until cleaned up';

CREATE TABLE IF NOT EXISTS upload_job_rows (
  id SERIAL PRIMARY KEY,
  upload_job_id INT NOT NULL REFERENCES upload_jobs(id) ON DELETE CASCADE,
  row_number INT NOT NULL,
  lecture_id INT REFERENCES lectures(id) ON DELETE SET NULL,
  college_id INT,
  status VARCHAR(16) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(upload_job_id, row_number)
);

CREATE INDEX IF NOT EXISTS idx_upload_job_rows_job_id ON upload_job_rows(upload_job_id);
CREATE INDEX IF NOT EXISTS idx_upload_job_rows_status ON upload_job_rows(upload_job_id, status);

COMMENT ON TABLE upload_job_rows IS 'Per-row outcomes for bulk upload jobs (lecture_id and/or college_id when success)';
