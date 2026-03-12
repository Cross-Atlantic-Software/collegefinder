-- Career Programs Junction Table
-- Links careers to programs (many-to-many)
CREATE TABLE IF NOT EXISTS career_programs (
  career_id INTEGER NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
  program_id INTEGER NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  PRIMARY KEY (career_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_career_programs_career_id ON career_programs(career_id);
CREATE INDEX IF NOT EXISTS idx_career_programs_program_id ON career_programs(program_id);

COMMENT ON TABLE career_programs IS 'Junction table linking careers to programs (many-to-many)';
