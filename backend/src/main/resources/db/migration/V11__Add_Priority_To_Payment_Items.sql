-- Add priority column to payment_items for expense prioritization
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'MEDIUM';

-- Update existing records to have MEDIUM priority
UPDATE payment_items SET priority = 'MEDIUM' WHERE priority IS NULL;
