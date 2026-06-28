-- ============================================================
-- HUNTLO REVENUE OS — SCHEMA UPDATES
-- Run this in the Supabase SQL editor
-- ============================================================

-- Add success_metrics field to deals (GAP 6)
ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS success_metrics TEXT;

-- Add next_action field to meetings (ensure it exists)
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS next_action TEXT;

-- Add ai_summary field to meetings (ensure it exists)
ALTER TABLE public.meetings ADD COLUMN IF NOT EXISTS ai_summary TEXT;
