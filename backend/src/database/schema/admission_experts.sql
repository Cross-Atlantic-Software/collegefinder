-- Admission Experts Table Schema
-- Stores experts shown on the Admission Help page, categorized by type

CREATE TABLE IF NOT EXISTS admission_experts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  photo_url TEXT,
  contact VARCHAR(255),
  phone VARCHAR(255),
  email VARCHAR(255),
  description TEXT,
  photo_file_name VARCHAR(255),
  linkedin_url VARCHAR(500),
  website VARCHAR(500),
  type VARCHAR(50) NOT NULL CHECK (type IN ('career_consultant', 'essay_resume', 'travel_visa', 'accommodation', 'loans_finance')),
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admission_experts_type ON admission_experts(type);
CREATE INDEX IF NOT EXISTS idx_admission_experts_is_active ON admission_experts(is_active);

DROP TRIGGER IF EXISTS update_admission_experts_updated_at ON admission_experts;
CREATE TRIGGER update_admission_experts_updated_at BEFORE UPDATE ON admission_experts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
