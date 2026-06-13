-- Growable Profile Field Registry (ExamFill Phase 1)
-- profile_field_registry: catalog of profile field paths (core + AI-discovered).
-- profile_field_values: per-student values for discovered (non-core) fields.
-- Idempotent + re-run-safe (migrations re-run every boot). No inner semicolons.

CREATE TABLE IF NOT EXISTS profile_field_registry (
    id                   SERIAL PRIMARY KEY,
    field_path           VARCHAR(150) UNIQUE NOT NULL,
    type                 VARCHAR(30) NOT NULL DEFAULT 'text',
    label                VARCHAR(200) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'pending',
    discovered_from_exam VARCHAR(100),
    discovered_label     VARCHAR(300),
    discovered_page_url  VARCHAR(500),
    reviewed_by          VARCHAR(100),
    reviewed_at          TIMESTAMP,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pfr_status ON profile_field_registry(status);

CREATE TABLE IF NOT EXISTS profile_field_values (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_path  VARCHAR(150) NOT NULL,
    value       TEXT,
    source      VARCHAR(20) NOT NULL DEFAULT 'student_edit',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, field_path)
);

CREATE INDEX IF NOT EXISTS idx_pfv_user ON profile_field_values(user_id);
