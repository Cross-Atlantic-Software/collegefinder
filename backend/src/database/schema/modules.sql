-- Modules taxonomy: id, name, code (for permission checks), timestamps
CREATE TABLE IF NOT EXISTS modules (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_modules_code ON modules(code);

DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE modules IS 'Admin panel modules for role-based access (Data Entry / Admin get specific modules only)';
