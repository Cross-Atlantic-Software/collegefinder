-- Add report_file_name to strength_results for matching PDFs when uploading from ZIP (like logo_file_name for exams)
ALTER TABLE strength_results ADD COLUMN IF NOT EXISTS report_file_name VARCHAR(255);
CREATE INDEX IF NOT EXISTS idx_strength_results_report_file_name ON strength_results(report_file_name) WHERE report_file_name IS NOT NULL;
