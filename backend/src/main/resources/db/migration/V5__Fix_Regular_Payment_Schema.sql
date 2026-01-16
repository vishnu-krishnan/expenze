-- Migrate data from legacy 'amount' column to 'default_planned_amount' if needed
UPDATE regular_payments 
SET default_planned_amount = amount 
WHERE (default_planned_amount IS NULL OR default_planned_amount = 0) 
  AND amount IS NOT NULL;

-- Remove the Not Null constraint or Drop the legacy columns which are not present in the new Entity
ALTER TABLE regular_payments DROP COLUMN IF EXISTS amount;
ALTER TABLE regular_payments DROP COLUMN IF EXISTS type;
ALTER TABLE regular_payments DROP COLUMN IF EXISTS next_payment_date;
