CREATE TABLE IF NOT EXISTS branch_programs (
  branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  PRIMARY KEY (branch_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_branch_programs_branch_id ON branch_programs(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_programs_program_id ON branch_programs(program_id);
