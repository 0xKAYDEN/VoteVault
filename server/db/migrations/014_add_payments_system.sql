-- Create payments table for USDT payment tracking
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'pro', 'enterprise')),
  amount DECIMAL(10, 2) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  activated_at TIMESTAMP,
  expires_at TIMESTAMP,
  CONSTRAINT unique_active_subscription UNIQUE (user_id, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX idx_payments_expires_at ON payments(expires_at);

-- Add subscription info to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;

-- Function to update user subscription when payment is activated
CREATE OR REPLACE FUNCTION update_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE users
    SET subscription_plan = NEW.plan,
        subscription_expires_at = NEW.expires_at
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user subscription
DROP TRIGGER IF EXISTS trigger_update_user_subscription ON payments;
CREATE TRIGGER trigger_update_user_subscription
AFTER UPDATE ON payments
FOR EACH ROW
EXECUTE FUNCTION update_user_subscription();
