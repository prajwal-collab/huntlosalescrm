-- ============================================
-- LINKEDIN OUTREACH TRACKING MODULE
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Create linkedin_outreach_logs table
CREATE TABLE IF NOT EXISTS public.linkedin_outreach_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  -- Contact details (snapshot at time of outreach)
  contact_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  designation TEXT,
  linkedin_url TEXT NOT NULL,

  -- Outreach details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'connection_request', 'message', 'inmail', 'accepted', 'replied'
  )),
  message_template TEXT,
  reply_sentiment TEXT CHECK (reply_sentiment IN (
    'interested', 'demo_booked', 'not_interested', 'neutral', 'no_reply'
  ) OR reply_sentiment IS NULL),
  notes TEXT,

  -- Metadata
  pushed_to_lead BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_li_outreach_org_owner
  ON public.linkedin_outreach_logs (organization_id, owner_id);

CREATE INDEX IF NOT EXISTS idx_li_outreach_linkedin_url
  ON public.linkedin_outreach_logs (linkedin_url);

CREATE INDEX IF NOT EXISTS idx_li_outreach_lead_id
  ON public.linkedin_outreach_logs (lead_id);

CREATE INDEX IF NOT EXISTS idx_li_outreach_created
  ON public.linkedin_outreach_logs (created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.linkedin_outreach_logs ENABLE ROW LEVEL SECURITY;

-- 4. Tenant isolation policy
CREATE POLICY "Tenant isolation for linkedin_outreach_logs"
  ON public.linkedin_outreach_logs
  FOR ALL
  TO authenticated
  USING (organization_id = get_user_organization_id());

-- 5. Add linkedin_touches_count to leads for fast aggregation (optional denorm)
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS linkedin_touches INTEGER DEFAULT 0;
