-- Strength Payments Table Schema
-- Tracks dummy payment status for the Know Your Strengths feature

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

CREATE INDEX IF NOT EXISTS idx_strength_payments_user_id ON strength_payments(user_id);

DROP TRIGGER IF EXISTS update_strength_payments_updated_at ON strength_payments;
CREATE TRIGGER update_strength_payments_updated_at BEFORE UPDATE ON strength_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
