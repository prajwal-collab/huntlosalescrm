-- ============================================
-- HUNTLO AI-NATIVE LEAD MANAGEMENT SCHEMA
-- Run this in your Supabase SQL Editor
-- ============================================

-- Drop if exists (clean slate)
drop table if exists public.leads cascade;

-- Create leads table
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- ── COMPANY INFO ──────────────────────────────
  company_name text not null,
  website text,
  linkedin_url text,
  industry text,
  company_type text check (company_type in ('Recruitment Agency','Staffing Firm','Startup','Enterprise','Other')),
  employee_size text,
  recruiter_team_size integer,
  location text,

  -- ── PRIMARY CONTACT ───────────────────────────
  contact_name text,
  designation text,
  email text,
  phone text,
  contact_linkedin text,

  -- ── LEAD STAGE ────────────────────────────────
  stage text not null default 'New Lead' check (stage in (
    'New Lead','Researching','Ready for Outreach','Outreach Started',
    'Engaged','Qualified','Demo Scheduled','Demo Complete',
    'Trial Started','Customer','Lost'
  )),

  -- ── SIGNALS (JSONB for flexibility) ───────────
  signals jsonb default '{
    "hiring_activity": false,
    "recruiter_hiring": false,
    "funding_activity": false,
    "linkedin_activity": false,
    "job_posting_activity": false,
    "company_growth": false,
    "referral_source": null,
    "outbound_source": null,
    "inbound_source": null,
    "intent_level": "Cold"
  }'::jsonb,

  signal_score integer default 0 check (signal_score >= 0 and signal_score <= 100),
  priority text default 'Cold' check (priority in ('Hot','Warm','Cold')),

  -- ── QUALIFICATION ─────────────────────────────
  pain_point text,
  current_workflow text,
  current_tools text,
  hiring_volume text,
  team_size text,
  buying_potential text check (buying_potential in ('High','Medium','Low','Unknown')),
  estimated_mrr integer default 0,
  icp_match_score integer default 0 check (icp_match_score >= 0 and icp_match_score <= 100),

  -- ── OUTREACH MANAGEMENT ───────────────────────
  first_contact_date date,
  last_contact_date date,
  campaign_type text,
  outreach_channel text,
  email_status text default 'Not Sent' check (email_status in ('Not Sent','Sent','Opened','Clicked','Replied','Bounced')),
  linkedin_status text default 'Not Sent' check (linkedin_status in ('Not Sent','Requested','Connected','Messaged','Replied')),
  whatsapp_status text default 'Not Sent' check (whatsapp_status in ('Not Sent','Sent','Delivered','Read','Replied')),
  reply_status text default 'No Reply' check (reply_status in ('No Reply','Positive','Neutral','Negative','Not Interested')),
  positive_interest boolean default false,
  demo_requested boolean default false,

  -- ── NEXT ACTION ───────────────────────────────
  next_action text,
  next_action_owner text,
  next_action_due date,
  next_action_priority text default 'Medium' check (next_action_priority in ('High','Medium','Low')),

  -- ── META ──────────────────────────────────────
  owner_id uuid,
  notes text,
  tags text[] default '{}',
  organization_id uuid references public.organizations(id) on delete cascade
);

-- Enable RLS
alter table public.leads enable row level security;

-- Policy: users can see all leads in their org (using authenticated)
create policy "Tenant isolation check"
  on public.leads
  for all
  to authenticated
  using (organization_id = get_user_organization_id());

create trigger set_leads_org_id before insert on public.leads for each row execute procedure set_organization_id();

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on public.leads
  for each row execute procedure public.handle_updated_at();

-- Indexes for performance
create index leads_stage_idx on public.leads (stage);
create index leads_priority_idx on public.leads (priority);
create index leads_signal_score_idx on public.leads (signal_score desc);
create index leads_next_action_due_idx on public.leads (next_action_due);
create index leads_company_name_idx on public.leads (company_name);
create index leads_updated_at_idx on public.leads (updated_at desc);

-- ============================================
-- DONE! Run this in Supabase SQL Editor.
-- ============================================
