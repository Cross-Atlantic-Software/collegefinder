-- Legal page CMS (JSON + optional rich HTML per section)
CREATE TABLE IF NOT EXISTS legal_page_content (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO legal_page_content (id, content_json) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;
