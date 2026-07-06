-- ============================================
-- SDR Activity Tracking Fields Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add SDR activity tracking fields to leads table
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS enrichment_done    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS enriched_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS outreach_sent      BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS trial_confirmed    BOOLEAN DEFAULT FALSE;

-- Add demo attendance tracking to meetings table
ALTER TABLE meetings
  ADD COLUMN IF NOT EXISTS attended BOOLEAN DEFAULT FALSE;

-- Backfill: mark meetings as attended if they are 'completed' and type = 'Demo'
UPDATE meetings
SET attended = TRUE
WHERE status = 'completed'
  AND (type = 'Demo' OR type = 'demo')
  AND attended IS NOT TRUE;

-- Backfill: mark trial_confirmed for leads already in 'Trial Started' stage
UPDATE leads
SET trial_confirmed = TRUE
WHERE stage = 'Trial Started'
  AND trial_confirmed IS NOT TRUE;
