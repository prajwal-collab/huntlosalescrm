-- ============================================================
-- HUNTLO — WEBHOOK SYSTEM SCHEMA
-- Run this in the Supabase SQL editor
-- ============================================================

-- Webhook configurations per organization
CREATE TABLE IF NOT EXISTS public.webhook_configs (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  secret_token    TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_enabled      BOOLEAN NOT NULL DEFAULT false,
  source_type     TEXT NOT NULL DEFAULT 'generic',  -- 'rb2b' | 'apollo' | 'zapier' | 'generic'
  field_map       JSONB DEFAULT '{}'::jsonb,         -- custom field mapping rules
  auto_create_leads BOOLEAN NOT NULL DEFAULT true,
  notify_team     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.webhook_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view webhook config"
  ON public.webhook_configs FOR SELECT
  USING (organization_id = get_user_organization_id());

CREATE POLICY "Org admins can manage webhook config"
  ON public.webhook_configs FOR ALL
  USING (organization_id = get_user_organization_id());

-- Webhook event log (incoming payloads)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  source          TEXT NOT NULL DEFAULT 'unknown',
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'received',   -- 'received' | 'processed' | 'failed' | 'skipped'
  error_message   TEXT,
  lead_id         UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view webhook events"
  ON public.webhook_events FOR SELECT
  USING (organization_id = get_user_organization_id());

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS webhook_events_org_idx ON public.webhook_events (organization_id, created_at DESC);
