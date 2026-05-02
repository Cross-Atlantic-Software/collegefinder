-- ONE-TIME / MANUAL ONLY — never run from application startup.
-- Destructive: drops all college tables and all college data.
-- Kept for rare dev resets. Application init must not execute this file.

-- Drop existing college tables and let schema recreate them with correct structure
DROP TABLE IF EXISTS college_recommended_exams CASCADE;
DROP TABLE IF EXISTS college_counselling_process CASCADE;
DROP TABLE IF EXISTS college_documents_required CASCADE;
DROP TABLE IF EXISTS college_key_dates CASCADE;
DROP TABLE IF EXISTS college_seat_matrix CASCADE;
DROP TABLE IF EXISTS college_expected_cutoff CASCADE;
DROP TABLE IF EXISTS college_previous_cutoff CASCADE;
DROP TABLE IF EXISTS college_programs CASCADE;
DROP TABLE IF EXISTS college_details CASCADE;
DROP TABLE IF EXISTS colleges CASCADE;
