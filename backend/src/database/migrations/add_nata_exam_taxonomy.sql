-- Add NATA (National Aptitude Test in Architecture) to exam taxonomy.
-- Idempotent: safe to run multiple times.

INSERT INTO exams_taxonomies (
  name,
  code,
  description,
  exam_type,
  conducting_authority,
  format,
  number_of_papers,
  website
)
VALUES (
  'NATA',
  'NATA',
  'National Aptitude Test in Architecture — aptitude assessment for B.Arch admission as per Council of Architecture norms.',
  'National',
  'Council of Architecture (COA)',
  '{
    "default": {
      "name": "NATA",
      "duration_minutes": 180,
      "total_questions": 50,
      "total_marks": 200
    }
  }'::jsonb,
  1,
  'https://www.nata.in/'
)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  exam_type = EXCLUDED.exam_type,
  conducting_authority = EXCLUDED.conducting_authority,
  format = EXCLUDED.format,
  number_of_papers = EXCLUDED.number_of_papers,
  website = EXCLUDED.website,
  updated_at = CURRENT_TIMESTAMP;
