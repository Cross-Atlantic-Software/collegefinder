-- Rename test module tables to self-explanatory names (for existing DBs that have old names).
-- On existing DB, schema may have just created empty new tables; we drop those and rename old→new.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mock_tests') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_mocks') THEN
      DROP TABLE exam_mocks CASCADE;
    END IF;
    ALTER TABLE mock_tests RENAME TO exam_mocks;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'mock_questions') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'exam_mock_questions') THEN
      DROP TABLE exam_mock_questions CASCADE;
    END IF;
    ALTER TABLE mock_questions RENAME TO exam_mock_questions;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'exam_mock_questions' AND column_name = 'mock_id') THEN
      ALTER TABLE exam_mock_questions RENAME COLUMN mock_id TO exam_mock_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'test_attempts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_exam_attempts') THEN
      DROP TABLE user_exam_attempts CASCADE;
    END IF;
    ALTER TABLE test_attempts RENAME TO user_exam_attempts;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_exam_attempts' AND column_name = 'mock_test_id') THEN
      ALTER TABLE user_exam_attempts RENAME COLUMN mock_test_id TO exam_mock_id;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'question_attempts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_attempt_answers') THEN
      DROP TABLE user_attempt_answers CASCADE;
    END IF;
    ALTER TABLE question_attempts RENAME TO user_attempt_answers;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_attempt_answers' AND column_name = 'test_attempt_id') THEN
      ALTER TABLE user_attempt_answers RENAME COLUMN test_attempt_id TO user_exam_attempt_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'user_attempt_answers' AND column_name = 'mock_id') THEN
      ALTER TABLE user_attempt_answers RENAME COLUMN mock_id TO exam_mock_id;
    END IF;
  END IF;
END $$;
