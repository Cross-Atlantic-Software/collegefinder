-- Migration: Restructure mock tests schema
-- Drops old tables and lets database.js recreate them with new schema
-- Run this before restarting the backend

-- Drop tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS question_attempts CASCADE;
DROP TABLE IF EXISTS mock_questions CASCADE;
DROP TABLE IF EXISTS test_attempts CASCADE;
DROP TABLE IF EXISTS mock_tests CASCADE;

-- Tables will be recreated by database.js with new schema:
-- - mock_tests: mock_number → order_index
-- - mock_questions: adds exam_id, mock_test_id → mock_id
-- - question_attempts: adds exam_id, mock_id
-- - test_attempts: updated to reference new mock_tests
