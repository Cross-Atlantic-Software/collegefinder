-- Admin user / module assignment (Data Entry and Admin get specific modules only)
CREATE TABLE IF NOT EXISTS admin_user_modules (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_user_modules_admin_user_id ON admin_user_modules(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_modules_module_id ON admin_user_modules(module_id);
