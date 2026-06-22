-- Fees & Credits Module (ExamFill) — wallet, packs, ledger, Razorpay orders, fill charges.
-- Idempotent + re-run-safe (migrations re-run every boot). Statements are split on ';',
-- so each statement is standalone (no inner semicolons; no dollar-quoted blocks here).
-- Money as DECIMAL(10,2); credits as INTEGER; gateway amounts in paise as INTEGER.
-- updated_at is maintained at the application layer (matches exam_adapters precedent).

-- payment_settings: single global config row (id=1). Holds the inclusive/exclusive GST toggle.
CREATE TABLE IF NOT EXISTS payment_settings (
    id          INTEGER PRIMARY KEY,
    gst_mode    VARCHAR(10) NOT NULL DEFAULT 'inclusive' CHECK (gst_mode IN ('inclusive','exclusive')),
    gst_percent DECIMAL(5,2) NOT NULL DEFAULT 18.00,
    currency    VARCHAR(3) NOT NULL DEFAULT 'INR',
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO payment_settings (id, gst_mode, gst_percent, currency)
VALUES (1, 'inclusive', 18.00, 'INR')
ON CONFLICT (id) DO NOTHING;

-- credit_packs: purchasable packs. price_inr is the all-in (GST-inclusive by default) price.
CREATE TABLE IF NOT EXISTS credit_packs (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL,
    credits    INTEGER NOT NULL,
    price_inr  DECIMAL(10,2) NOT NULL,
    is_active  BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO credit_packs (name, credits, price_inr, sort_order)
SELECT '1 Credit', 1, 49.00, 1
WHERE NOT EXISTS (SELECT 1 FROM credit_packs WHERE name = '1 Credit');

INSERT INTO credit_packs (name, credits, price_inr, sort_order)
SELECT '5 Credits', 5, 299.00, 2
WHERE NOT EXISTS (SELECT 1 FROM credit_packs WHERE name = '5 Credits');

INSERT INTO credit_packs (name, credits, price_inr, sort_order)
SELECT '10 Credits', 10, 399.00, 3
WHERE NOT EXISTS (SELECT 1 FROM credit_packs WHERE name = '10 Credits');

-- credit_wallets: one balance row per user. balance can never go negative.
CREATE TABLE IF NOT EXISTS credit_wallets (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance    INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_wallets_user ON credit_wallets(user_id);

-- credit_transactions is created by add_user_credits_system.sql (main's canonical schema:
-- amount/reference_type/idempotency_key). It is intentionally NOT defined here to avoid a
-- conflicting duplicate; that migration runs before this one (see config/database.js).

-- credit_orders: Razorpay purchases. UNIQUE(razorpay_payment_id) is the double-credit guard.
CREATE TABLE IF NOT EXISTS credit_orders (
    id                  SERIAL PRIMARY KEY,
    user_id             INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pack_id             INTEGER REFERENCES credit_packs(id),
    credits             INTEGER NOT NULL,
    gst_mode            VARCHAR(10) NOT NULL,
    gst_percent         DECIMAL(5,2) NOT NULL,
    base_amount         DECIMAL(10,2) NOT NULL,
    gst_amount          DECIMAL(10,2) NOT NULL,
    total_amount        DECIMAL(10,2) NOT NULL,
    amount_paise        INTEGER NOT NULL,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    razorpay_order_id   VARCHAR(64),
    razorpay_payment_id VARCHAR(64) UNIQUE,
    razorpay_signature  VARCHAR(128),
    status              VARCHAR(12) NOT NULL DEFAULT 'created' CHECK (status IN ('created','paid','failed')),
    invoice_number      VARCHAR(40),
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    paid_at             TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_credit_orders_user ON credit_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_orders_rzp_order ON credit_orders(razorpay_order_id);

-- fill_charges: the application entity. One debit per application, charged up front at fill start.
CREATE TABLE IF NOT EXISTS fill_charges (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_id         VARCHAR(50) NOT NULL,
    credits_charged INTEGER NOT NULL,
    status          VARCHAR(12) NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','refunded')),
    debit_txn_id    INTEGER REFERENCES credit_transactions(id),
    refund_txn_id   INTEGER REFERENCES credit_transactions(id),
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at    TIMESTAMP,
    refunded_at     TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fill_charges_user ON fill_charges(user_id);

-- One active charge per (user, exam): makes charge-once + free-across-sections correct at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_fill_charge ON fill_charges(user_id, exam_id) WHERE status = 'active';

-- Per-exam money fields on the adapter (credit_cost is INTEGER — credits are whole units).
ALTER TABLE exam_adapters ADD COLUMN IF NOT EXISTS credit_cost INTEGER DEFAULT 1;
ALTER TABLE exam_adapters ADD COLUMN IF NOT EXISTS exam_fee DECIMAL(10,2);
