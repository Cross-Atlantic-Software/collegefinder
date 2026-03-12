-- Rename "Career Goals" module to "Interests" in modules table
UPDATE modules SET name = 'Interests' WHERE code = 'career_goals';
