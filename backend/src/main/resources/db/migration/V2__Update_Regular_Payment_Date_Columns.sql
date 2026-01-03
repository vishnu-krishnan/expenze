-- Add new columns for refactored RegularPayment entity
ALTER TABLE regular_payments ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE regular_payments ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE regular_payments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE regular_payments ADD COLUMN IF NOT EXISTS default_planned_amount NUMERIC(38, 2) DEFAULT 0;

-- Ensure frequency is present and large enough
ALTER TABLE regular_payments ADD COLUMN IF NOT EXISTS frequency VARCHAR(50);
-- Set default if null
UPDATE regular_payments SET frequency = 'MONTHLY' WHERE frequency IS NULL;
