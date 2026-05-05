ALTER TABLE user_queries
  ADD COLUMN IF NOT EXISTS admin_answer TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS resolved_by_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_queries_resolved_by_admin_id ON user_queries(resolved_by_admin_id);

INSERT INTO modules (name, code)
VALUES ('Queries', 'queries')
ON CONFLICT (code) DO NOTHING;
