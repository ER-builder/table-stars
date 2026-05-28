-- Add delivered_at to track when the parent physically gave the prize.
-- NULL = pending delivery; timestamp = delivered.
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
