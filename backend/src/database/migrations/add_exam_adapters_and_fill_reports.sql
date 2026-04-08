-- ExamFill Chrome Extension — Database Tables
-- Run this migration to create the exam_adapters and fill_reports tables.

-- exam_adapters: stores adapter JSON config per exam portal
CREATE TABLE IF NOT EXISTS exam_adapters (
    id                  SERIAL PRIMARY KEY,
    exam_id             VARCHAR(50) UNIQUE NOT NULL,
    exam_name           VARCHAR(100) NOT NULL,
    portal_url_pattern  VARCHAR(200) NOT NULL,
    adapter_config      JSONB NOT NULL,
    version             INTEGER DEFAULT 1,
    is_active           BOOLEAN DEFAULT TRUE,
    last_verified_at    TIMESTAMP,
    last_verified_by    VARCHAR(100),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- fill_reports: logs every fill attempt for analytics and debugging
CREATE TABLE IF NOT EXISTS fill_reports (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER REFERENCES users(id),
    exam_id             VARCHAR(50),
    section_name        VARCHAR(100),
    total_fields        INTEGER,
    filled_count        INTEGER,
    check_count         INTEGER,
    failed_count        INTEGER,
    field_results       JSONB,
    adapter_version     INTEGER,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_exam_adapters_exam_id ON exam_adapters(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_adapters_active ON exam_adapters(is_active);
CREATE INDEX IF NOT EXISTS idx_fill_reports_user ON fill_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_fill_reports_exam ON fill_reports(exam_id);
CREATE INDEX IF NOT EXISTS idx_fill_reports_created ON fill_reports(created_at DESC);
