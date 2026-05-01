-- Async colleges bulk upload: link successful rows to colleges.id
ALTER TABLE upload_job_rows ADD COLUMN IF NOT EXISTS college_id INTEGER REFERENCES colleges(id) ON DELETE SET NULL;
