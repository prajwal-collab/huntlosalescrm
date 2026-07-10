-- ============================================================
-- HUNTLO — WEBINAR MODULE SCHEMA
-- ============================================================

-- 1. Webinars Table (Campaign Object)
CREATE TABLE IF NOT EXISTS public.webinars (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  theme_month TEXT,
  segment TEXT,
  is_flagship BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'Planned',
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  recording_url TEXT,
  slide_deck_url TEXT,
  primary_cta_offer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinars ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinars FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinars_org_id BEFORE INSERT ON public.webinars FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 2. Webinar Funnel Stages
CREATE TABLE IF NOT EXISTS public.webinar_funnel_stages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinar_funnel_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinar_funnel_stages FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinar_funnel_stages_org_id BEFORE INSERT ON public.webinar_funnel_stages FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 3. Modify tasks table (if not exists)
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS funnel_stage_id UUID REFERENCES public.webinar_funnel_stages(id) ON DELETE CASCADE;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS checklist_source TEXT;


-- 4. Webinar Registrants (Maps onto Contacts, but keeps webinar-specific state)
CREATE TABLE IF NOT EXISTS public.webinar_registrants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE CASCADE,
  qualification_answers JSONB DEFAULT '{}'::jsonb,
  lead_score INTEGER DEFAULT 0,
  attended BOOLEAN DEFAULT false,
  demo_requested BOOLEAN DEFAULT false,
  funnel_stage TEXT DEFAULT 'Registration',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinar_registrants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinar_registrants FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinar_registrants_org_id BEFORE INSERT ON public.webinar_registrants FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 5. Webinar Content Assets
CREATE TABLE IF NOT EXISTS public.webinar_content_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT,
  publish_date TIMESTAMP WITH TIME ZONE,
  channel TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinar_content_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinar_content_assets FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinar_content_assets_org_id BEFORE INSERT ON public.webinar_content_assets FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 6. Webinar Follow Up Sequences
CREATE TABLE IF NOT EXISTS public.webinar_follow_ups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  webinar_id UUID REFERENCES public.webinars(id) ON DELETE CASCADE,
  day_offset INTEGER NOT NULL,
  channel TEXT,
  content TEXT,
  send_status TEXT DEFAULT 'Scheduled',
  recipient_segment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinar_follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinar_follow_ups FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinar_follow_ups_org_id BEFORE INSERT ON public.webinar_follow_ups FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 7. Webinar SOPs (Templates)
CREATE TABLE IF NOT EXISTS public.webinar_sops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  tasks JSONB DEFAULT '[]'::jsonb, -- Array of task templates { offset_days: -14, title: '...', type: 'prep' }
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.webinar_sops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tenant isolation check" ON public.webinar_sops FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);
CREATE TRIGGER set_webinar_sops_org_id BEFORE INSERT ON public.webinar_sops FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
