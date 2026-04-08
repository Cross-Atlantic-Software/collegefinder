-- Optional JSONB for exam shortlist / directory display (fee, difficulty, etc.).
-- Values are stored in the database and returned by GET /api/exams; the frontend does not hardcode them.

ALTER TABLE exams_taxonomies
  ADD COLUMN IF NOT EXISTS shortlist_meta JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN exams_taxonomies.shortlist_meta IS 'Optional display fields for lists: subtitle, fee_inr, difficulty, applicants_label, colleges_label, eligibility_label, mode';

-- Seed shortlist_meta, exam_dates, and exam_pattern per exam code (idempotent).

UPDATE exams_taxonomies SET shortlist_meta = '{
  "subtitle": "Engineering entrance",
  "fee_inr": 1000,
  "difficulty": "High",
  "applicants_label": "12 Lakh",
  "colleges_label": "1,500+",
  "eligibility_label": "12th PCM; institute-specific rules apply"
}'::jsonb WHERE code = 'JEE_MAIN';

UPDATE exams_taxonomies SET shortlist_meta = '{
  "subtitle": "IIT engineering entrance",
  "fee_inr": 2900,
  "difficulty": "High",
  "applicants_label": "2 Lakh",
  "colleges_label": "23 IITs",
  "eligibility_label": "Top performers in JEE Main"
}'::jsonb WHERE code = 'JEE_ADVANCED';

UPDATE exams_taxonomies SET shortlist_meta = '{
  "subtitle": "Medical entrance",
  "fee_inr": 1700,
  "difficulty": "High",
  "applicants_label": "20 Lakh",
  "colleges_label": "600+",
  "eligibility_label": "12th PCB with minimum marks as per notice"
}'::jsonb WHERE code = 'NEET';

UPDATE exams_taxonomies SET shortlist_meta = '{
  "subtitle": "University entrance",
  "fee_inr": 800,
  "difficulty": "Medium",
  "applicants_label": "15 Lakh",
  "colleges_label": "250+",
  "eligibility_label": "12th pass; domain tests as per programme"
}'::jsonb WHERE code = 'CUET';

UPDATE exams_taxonomies SET shortlist_meta = '{
  "subtitle": "Architecture entrance",
  "fee_inr": 3000,
  "difficulty": "Medium",
  "applicants_label": "50K",
  "colleges_label": "400+",
  "eligibility_label": "12th pass with Mathematics; see NATA brochure"
}'::jsonb WHERE code = 'NATA';

INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date)
SELECT id, '2025-11-01'::date, '2025-11-30'::date, '2026-01-22'::date
FROM exams_taxonomies WHERE code = 'JEE_MAIN'
ON CONFLICT (exam_id) DO UPDATE SET
  application_start_date = EXCLUDED.application_start_date,
  application_close_date = EXCLUDED.application_close_date,
  exam_date = EXCLUDED.exam_date,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date)
SELECT id, '2025-11-01'::date, '2026-06-15'::date, '2026-05-24'::date
FROM exams_taxonomies WHERE code = 'JEE_ADVANCED'
ON CONFLICT (exam_id) DO UPDATE SET
  application_start_date = EXCLUDED.application_start_date,
  application_close_date = EXCLUDED.application_close_date,
  exam_date = EXCLUDED.exam_date,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date)
SELECT id, '2026-02-01'::date, '2026-03-15'::date, '2026-05-03'::date
FROM exams_taxonomies WHERE code = 'NEET'
ON CONFLICT (exam_id) DO UPDATE SET
  application_start_date = EXCLUDED.application_start_date,
  application_close_date = EXCLUDED.application_close_date,
  exam_date = EXCLUDED.exam_date,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date)
SELECT id, '2026-02-01'::date, '2026-05-30'::date, '2026-05-15'::date
FROM exams_taxonomies WHERE code = 'CUET'
ON CONFLICT (exam_id) DO UPDATE SET
  application_start_date = EXCLUDED.application_start_date,
  application_close_date = EXCLUDED.application_close_date,
  exam_date = EXCLUDED.exam_date,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_dates (exam_id, application_start_date, application_close_date, exam_date)
SELECT id, '2026-03-09'::date, '2026-06-13'::date, '2026-04-04'::date
FROM exams_taxonomies WHERE code = 'NATA'
ON CONFLICT (exam_id) DO UPDATE SET
  application_start_date = EXCLUDED.application_start_date,
  application_close_date = EXCLUDED.application_close_date,
  exam_date = EXCLUDED.exam_date,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_pattern (exam_id, mode, number_of_questions, duration_minutes)
SELECT id, 'Online', 90, 180 FROM exams_taxonomies WHERE code = 'JEE_MAIN'
ON CONFLICT (exam_id) DO UPDATE SET
  mode = EXCLUDED.mode,
  number_of_questions = EXCLUDED.number_of_questions,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_pattern (exam_id, mode, number_of_questions, duration_minutes)
SELECT id, 'Online', 108, 360 FROM exams_taxonomies WHERE code = 'JEE_ADVANCED'
ON CONFLICT (exam_id) DO UPDATE SET
  mode = EXCLUDED.mode,
  number_of_questions = EXCLUDED.number_of_questions,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_pattern (exam_id, mode, number_of_questions, duration_minutes)
SELECT id, 'Offline', 200, 180 FROM exams_taxonomies WHERE code = 'NEET'
ON CONFLICT (exam_id) DO UPDATE SET
  mode = EXCLUDED.mode,
  number_of_questions = EXCLUDED.number_of_questions,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_pattern (exam_id, mode, number_of_questions, duration_minutes)
SELECT id, 'Online', 50, 180 FROM exams_taxonomies WHERE code = 'CUET'
ON CONFLICT (exam_id) DO UPDATE SET
  mode = EXCLUDED.mode,
  number_of_questions = EXCLUDED.number_of_questions,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO exam_pattern (exam_id, mode, number_of_questions, duration_minutes)
SELECT id, 'Hybrid', 50, 180 FROM exams_taxonomies WHERE code = 'NATA'
ON CONFLICT (exam_id) DO UPDATE SET
  mode = EXCLUDED.mode,
  number_of_questions = EXCLUDED.number_of_questions,
  duration_minutes = EXCLUDED.duration_minutes,
  updated_at = CURRENT_TIMESTAMP;
