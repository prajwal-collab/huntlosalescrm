-- ============================================================
-- HUNTLO REVENUE OS — DEAL FINANCE TRACKING FIELDS
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add expected_payment_date and follow_up_date to deals table
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS expected_payment_date DATE;
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS follow_up_date DATE;
