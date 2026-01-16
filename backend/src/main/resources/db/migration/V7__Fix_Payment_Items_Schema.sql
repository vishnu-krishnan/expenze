-- Add missing columns to payment_items
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS month_plan_id BIGINT;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS planned_amount NUMERIC(38, 2) DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS actual_amount NUMERIC(38, 2) DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS is_paid INTEGER DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- Migrate data if possible
UPDATE payment_items SET planned_amount = price WHERE planned_amount = 0 AND price IS NOT NULL;

-- Drop legacy columns not in Entity
ALTER TABLE payment_items DROP COLUMN IF EXISTS price;
ALTER TABLE payment_items DROP COLUMN IF EXISTS type;
ALTER TABLE payment_items DROP COLUMN IF EXISTS is_planned;
ALTER TABLE payment_items DROP COLUMN IF EXISTS payment_date;
