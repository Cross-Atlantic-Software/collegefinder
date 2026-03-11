-- Loans Module - Same pattern as Exams (CRUD + Excel + logo bulk upload)
-- 1. Main loan_providers table
CREATE TABLE IF NOT EXISTS loan_providers (
  id SERIAL PRIMARY KEY,
  provider_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(100),
  interest_rate_min DECIMAL(5, 2),
  interest_rate_max DECIMAL(5, 2),
  processing_fee VARCHAR(255),
  max_loan_amount VARCHAR(255),
  moratorium_period_months INTEGER,
  repayment_duration_years INTEGER,
  collateral_required BOOLEAN DEFAULT FALSE,
  coapplicant_required BOOLEAN DEFAULT FALSE,
  tax_benefit_available BOOLEAN DEFAULT FALSE,
  official_website_link VARCHAR(500),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  description TEXT,
  logo VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_providers_name ON loan_providers(provider_name);
CREATE INDEX IF NOT EXISTS idx_loan_providers_type ON loan_providers(provider_type);

DROP TRIGGER IF EXISTS update_loan_providers_updated_at ON loan_providers;
CREATE TRIGGER update_loan_providers_updated_at BEFORE UPDATE ON loan_providers
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. loan_disbursement_process
CREATE TABLE IF NOT EXISTS loan_disbursement_process (
  id SERIAL PRIMARY KEY,
  loan_provider_id INTEGER NOT NULL REFERENCES loan_providers(id) ON DELETE CASCADE,
  step_number INTEGER,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_disbursement_loan_provider_id ON loan_disbursement_process(loan_provider_id);

-- 3. loan_eligible_countries
CREATE TABLE IF NOT EXISTS loan_eligible_countries (
  id SERIAL PRIMARY KEY,
  loan_provider_id INTEGER NOT NULL REFERENCES loan_providers(id) ON DELETE CASCADE,
  country_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_eligible_countries_loan_provider_id ON loan_eligible_countries(loan_provider_id);

-- 4. loan_eligible_course_types
CREATE TABLE IF NOT EXISTS loan_eligible_course_types (
  id SERIAL PRIMARY KEY,
  loan_provider_id INTEGER NOT NULL REFERENCES loan_providers(id) ON DELETE CASCADE,
  course_type VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_loan_eligible_course_types_loan_provider_id ON loan_eligible_course_types(loan_provider_id);

COMMENT ON TABLE loan_providers IS 'Loan providers (banks, NBFCs) with terms and contact info';
COMMENT ON TABLE loan_disbursement_process IS 'Step-by-step disbursement process per provider';
COMMENT ON TABLE loan_eligible_countries IS 'Countries where loan is available';
COMMENT ON TABLE loan_eligible_course_types IS 'Eligible course types for the loan';
