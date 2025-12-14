-- Migration: Add currency column to businesses table
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD';
