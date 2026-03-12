-- Add branch column to college_seat_matrix for branch vs category (2D) structure
-- Format: Branch-Category:Count (e.g. CSE-general:50, CSE-OBC:30)
ALTER TABLE college_seat_matrix ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
COMMENT ON COLUMN college_seat_matrix.branch IS 'Branch/specialization (e.g. CSE, ECE). With category, forms branch vs caste 2D matrix.';
