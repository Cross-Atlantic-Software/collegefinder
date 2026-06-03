ALTER TABLE exam_mocks ADD COLUMN IF NOT EXISTS generation_error TEXT;

COMMENT ON COLUMN exam_mocks.generation_error IS 'Last generation failure reason (e.g. Gemini quota exceeded)';
