-- Ensure all required columns exist in payment_items table
-- This acts as a safeguard if V7 failed or wasn't applied correctly

-- 1. Add columns required by the PaymentItem entity
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS month_plan_id BIGINT;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS planned_amount NUMERIC(38, 2) DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS actual_amount NUMERIC(38, 2) DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS is_paid INTEGER DEFAULT 0;
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Drop legacy columns that are no longer mapped in the entity
-- Using IF EXISTS to prevent errors if they are already gone
ALTER TABLE payment_items DROP COLUMN IF EXISTS price;
ALTER TABLE payment_items DROP COLUMN IF EXISTS type;
ALTER TABLE payment_items DROP COLUMN IF EXISTS is_planned;
ALTER TABLE payment_items DROP COLUMN IF EXISTS payment_date;
