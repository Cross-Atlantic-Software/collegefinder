-- Migration: Restructure colleges module with new fields and sections
-- Date: 2026-03-17

-- 1. Add new columns to colleges table
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS google_map_link TEXT;
ALTER TABLE colleges ADD COLUMN IF NOT EXISTS website VARCHAR(500);

-- Remove CHECK constraint on college_type to allow comma-separated multiple values
ALTER TABLE colleges DROP CONSTRAINT IF EXISTS colleges_college_type_check;

-- 2. Add major_program_ids to college_details (comma-separated program IDs)
ALTER TABLE college_details ADD COLUMN IF NOT EXISTS major_program_ids TEXT;

-- 3. Add new columns to college_programs for restructured Program Details
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS branch_course VARCHAR(255);
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS program_description TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS duration_unit VARCHAR(50) DEFAULT 'years';
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS key_dates_summary TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS fee_per_semester DECIMAL(12,2);
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS total_fee DECIMAL(12,2);
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS placement TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS scholarship TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS counselling_process TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS documents_required TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS recommended_exam_ids TEXT;
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255);
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50);
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS brochure_url TEXT;
