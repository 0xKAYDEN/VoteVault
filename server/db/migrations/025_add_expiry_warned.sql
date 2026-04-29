-- Add expiry_warned flag to payments so the scheduler doesn't re-send warning emails
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS expiry_warned TINYINT(1) NOT NULL DEFAULT 0;
