-- ExamFill — add SSC CGL to the exam catalog and register a draft adapter stub.
-- Also documents the slug convention used to link exams_taxonomies -> exam_adapters.
-- Idempotent: safe to run multiple times.

-- 1) Catalog row (exams_taxonomies). Skips if an exam with this name already exists.
INSERT INTO exams_taxonomies (name, code, conducting_authority, exam_type, website, registration_link, abbreviation, description)
SELECT 'SSC CGL',
       'SSC_CGL',
       'Staff Selection Commission',
       'Government Recruitment',
       'https://ssc.gov.in',
       'https://ssc.gov.in',
       'SSC CGL',
       'Staff Selection Commission Combined Graduate Level examination for Group B and Group C posts in central government ministries and departments.'
WHERE NOT EXISTS (
  SELECT 1 FROM exams_taxonomies WHERE lower(name) = lower('SSC CGL')
);

-- 2) Adapter stub (exam_adapters). exam_id is the slug derived from the catalog code:
--    btrim(regexp_replace(lower(coalesce(nullif(code,''), name)), '[^a-z0-9]+', '_', 'g'), '_')
--    => 'ssc_cgl'. Starts as a DRAFT so only admins (Builder) see it until published.
INSERT INTO exam_adapters (exam_id, exam_name, portal_url_pattern, adapter_config, version, is_active, status, is_ai_generated)
VALUES ('ssc_cgl', 'SSC CGL', 'ssc.gov.in', '{"sections": []}'::jsonb, 1, FALSE, 'draft', FALSE)
ON CONFLICT (exam_id) DO NOTHING;

-- 3) Eligibility: surface SSC CGL on the dashboard for the Science (PCM) stream.
--    The dashboard exam pool matches exams whose exam_eligibility_criteria.stream_ids
--    contains the student's stream id. Merges (unions) with any existing stream_ids.
INSERT INTO exam_eligibility_criteria (exam_id, stream_ids)
SELECT t.id, ARRAY[s.id]::integer[]
  FROM exams_taxonomies t
  CROSS JOIN streams s
 WHERE lower(t.name) = lower('SSC CGL') AND s.name = 'Science (PCM)'
ON CONFLICT (exam_id) DO UPDATE
   SET stream_ids = ARRAY(SELECT DISTINCT unnest(exam_eligibility_criteria.stream_ids || EXCLUDED.stream_ids)),
       updated_at = CURRENT_TIMESTAMP;
