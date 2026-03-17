-- Add branch_id to college_programs to link to branches table (name in Excel/form matched to branch, store id)
ALTER TABLE college_programs ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_college_programs_branch_id ON college_programs(branch_id);
COMMENT ON COLUMN college_programs.branch_id IS 'Resolved from branch_course name via branches table (manual form and bulk Excel).';
