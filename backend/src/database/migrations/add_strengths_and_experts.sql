-- Migration: Add Strengths & Admission Help tables + counsellor admin type
-- Creates: strength_payments, strength_results, admission_experts
-- Updates: admin_users type CHECK constraint to include 'counsellor'

DO $$
BEGIN
  -- Update admin_users type constraint to include counsellor
  ALTER TABLE admin_users DROP CONSTRAINT IF EXISTS admin_users_type_check;
  ALTER TABLE admin_users ADD CONSTRAINT admin_users_type_check
    CHECK (type IN ('data_entry', 'admin', 'super_admin', 'counsellor'));

  -- Create strength_payments table
  CREATE TABLE IF NOT EXISTS strength_payments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'not_paid' CHECK (payment_status IN ('paid', 'not_paid')),
    amount DECIMAL(10, 2),
    paid_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );

  -- Create strength_results table
  CREATE TABLE IF NOT EXISTS strength_results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    counsellor_admin_id INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    strengths JSONB NOT NULL DEFAULT '[]',
    career_recommendations JSONB NOT NULL DEFAULT '[]',
    report_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
  );

  -- Create admission_experts table
  CREATE TABLE IF NOT EXISTS admission_experts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    photo_url VARCHAR(500),
    contact VARCHAR(255),
    type VARCHAR(50) NOT NULL CHECK (type IN ('career_consultant', 'essay_resume', 'travel_visa', 'accommodation', 'loans_finance')),
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  RAISE NOTICE 'Strengths & experts tables created successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Migration add_strengths_and_experts: %', SQLERRM;
END $$;

-- Indexes (safe to run outside the DO block with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_strength_payments_user_id ON strength_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_strength_results_user_id ON strength_results(user_id);
CREATE INDEX IF NOT EXISTS idx_admission_experts_type ON admission_experts(type);
CREATE INDEX IF NOT EXISTS idx_admission_experts_is_active ON admission_experts(is_active);

-- Triggers
DROP TRIGGER IF EXISTS update_strength_payments_updated_at ON strength_payments;
CREATE TRIGGER update_strength_payments_updated_at BEFORE UPDATE ON strength_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_strength_results_updated_at ON strength_results;
CREATE TRIGGER update_strength_results_updated_at BEFORE UPDATE ON strength_results
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admission_experts_updated_at ON admission_experts;
CREATE TRIGGER update_admission_experts_updated_at BEFORE UPDATE ON admission_experts
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
