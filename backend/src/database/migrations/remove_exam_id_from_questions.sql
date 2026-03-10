-- Remove exam_id from questions table (structural only — no data deletion).
-- Questions are a shared bank; exam association is via exam_mock_questions only.
-- NOTE: Do NOT truncate or delete from questions/exam_mock_questions here;
-- this migration runs on DB init and must be safe to re-run.

-- 1. Drop exam_id column if it exists
ALTER TABLE questions DROP COLUMN IF EXISTS exam_id;

-- 2. Drop old exam-based indexes if they exist (they reference exam_id)
DROP INDEX IF EXISTS idx_questions_exam_id;
DROP INDEX IF EXISTS idx_questions_exam_subject_difficulty;
DROP INDEX IF EXISTS idx_questions_exam_topic;
DROP INDEX IF EXISTS idx_questions_section_filters;
DROP INDEX IF EXISTS idx_questions_exam_section_subject;
