-- Migration: modules table, admin_user_modules, admin_users type = data_entry | admin | super_admin
-- Idempotent where possible

-- 1. Create modules table if not exists
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

-- 2. Seed default modules (ignore if already present)
INSERT INTO modules (name, code) VALUES
  ('Career Goals', 'career_goals'),
  ('Subjects', 'subjects'),
  ('Streams', 'streams'),
  ('Careers', 'careers'),
  ('Topics', 'topics'),
  ('Subtopics', 'subtopics'),
  ('Lectures', 'lectures'),
  ('Purposes', 'purposes'),
  ('Levels', 'levels'),
  ('Programs', 'programs'),
  ('Categories', 'categories'),
  ('Exam Cities', 'exam_cities'),
  ('Exams', 'exams'),
  ('Colleges', 'colleges'),
  ('Institutes', 'institutes'),
  ('Scholarships', 'scholarships'),
  ('Loans', 'loans'),
  ('Email Templates', 'email_templates'),
  ('Blogs', 'blogs'),
  ('Applications', 'applications'),
  ('Automation Exams', 'automation_exams'),
  ('Users', 'users')
ON CONFLICT (code) DO NOTHING;

-- 3. admin_user_modules junction
CREATE TABLE IF NOT EXISTS admin_user_modules (
  id SERIAL PRIMARY KEY,
  admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  module_id INTEGER NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(admin_user_id, module_id)
);
CREATE INDEX IF NOT EXISTS idx_admin_user_modules_admin_user_id ON admin_user_modules(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_user_modules_module_id ON admin_user_modules(module_id);

-- 4. Update admin_users type: allow data_entry, admin, super_admin (remove 'user')
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_users') THEN
    UPDATE admin_users SET type = 'data_entry' WHERE type = 'user';
    ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_type_check;
    ALTER TABLE admin_users ADD CONSTRAINT admin_users_type_check
      CHECK (type IN ('data_entry', 'admin', 'super_admin'));
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
