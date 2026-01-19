-- Fix system_settings table to match SystemSetting entity
-- Add missing columns that exist in entity but not in database

ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS setting_type VARCHAR(255) DEFAULT 'text';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'general';
ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS is_public INTEGER DEFAULT 0;
