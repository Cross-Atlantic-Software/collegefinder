-- Add exam-specific generation prompt for mock question generation.
-- When set, this prompt is used instead of the generic one. Placeholders: {{exam_name}}, {{subject}}, {{difficulty}}, {{topic}}, {{section_name}}, {{section_type}}, {{question_type}}

ALTER TABLE exams_taxonomies ADD COLUMN IF NOT EXISTS generation_prompt TEXT;

COMMENT ON COLUMN exams_taxonomies.generation_prompt IS 'Optional exam-specific prompt for LLM question generation. If null, generic prompt is used. Placeholders: {{exam_name}}, {{subject}}, {{difficulty}}, {{topic}}, {{section_name}}, {{section_type}}, {{question_type}}';
