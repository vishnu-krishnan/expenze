-- Fix email_change_requests table column names to match Entity
ALTER TABLE email_change_requests RENAME COLUMN expiry_date TO expires_at;
ALTER TABLE email_change_requests RENAME COLUMN otp_code TO otp;
ALTER TABLE email_change_requests DROP COLUMN IF EXISTS verified;
