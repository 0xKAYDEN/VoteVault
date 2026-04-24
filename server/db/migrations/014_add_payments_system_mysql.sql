-- Create payments table for USDT payment tracking (MySQL version)
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('basic', 'pro', 'enterprise')),
  amount DECIMAL(10, 2) NOT NULL,
  tx_hash VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'expired')),
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activated_at TIMESTAMP NULL,
  expires_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_tx_hash ON payments(tx_hash);
CREATE INDEX idx_payments_expires_at ON payments(expires_at);

-- Add subscription info to users table (ignore if columns already exist)
ALTER TABLE users ADD COLUMN subscription_plan VARCHAR(50);
ALTER TABLE users ADD COLUMN subscription_expires_at TIMESTAMP NULL;

-- Trigger to automatically update user subscription when payment is activated
DELIMITER $$

CREATE TRIGGER trigger_update_user_subscription
AFTER UPDATE ON payments
FOR EACH ROW
BEGIN
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    UPDATE users
    SET subscription_plan = NEW.plan,
        subscription_expires_at = NEW.expires_at
    WHERE id = NEW.user_id;
  END IF;
END$$

DELIMITER ;
