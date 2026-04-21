ALTER TABLE lectures ADD COLUMN IF NOT EXISTS hook_summary TEXT;

COMMENT ON COLUMN lectures.hook_summary IS 'Gemini-generated 2-line student-facing hook (Netflix-style), from title/description/taxonomies.';
