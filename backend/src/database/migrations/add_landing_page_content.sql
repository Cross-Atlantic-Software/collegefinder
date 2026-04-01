-- Landing page CMS (text only; images/video paths stay in frontend)
CREATE TABLE IF NOT EXISTS landing_page_content (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO landing_page_content (id, content_json) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO modules (name, code) VALUES ('Landing page', 'landing_page')
ON CONFLICT (code) DO NOTHING;
