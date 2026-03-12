-- Add branch column to college_previous_cutoff and college_expected_cutoff for branch vs caste 2D format
-- Format: Exam|Branch-Category:Rank, Branch-Category:Rank|Year (e.g. JEE Main|CSE-GEN:1000, CSE-OBC:1500|2024)
ALTER TABLE college_previous_cutoff ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
ALTER TABLE college_expected_cutoff ADD COLUMN IF NOT EXISTS branch VARCHAR(100);
COMMENT ON COLUMN college_previous_cutoff.branch IS 'Branch (e.g. CSE, ECE). With category, forms branch vs caste 2D matrix for rank.';
COMMENT ON COLUMN college_expected_cutoff.branch IS 'Branch (e.g. CSE, ECE). With category, forms branch vs caste 2D matrix for rank.';
