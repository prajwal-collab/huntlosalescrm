-- ==========================================
-- HUNTLO SALES OS — SUPABASE ENTERPRISE SCHEMA
-- ==========================================
-- Copy and paste this entirely into the Supabase SQL Editor and click "Run"

-- Drop existing objects if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.sequences CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.meetings CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.deals CASCADE;
DROP TABLE IF EXISTS public.contacts CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

-- 1. Create Organizations Table (Tenants)
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT 'My Workspace',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create Profiles table (links to auth.users and public.organizations)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'Member',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS) for Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a secure function to get the current user's organization ID
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone in organization." 
  ON public.profiles FOR SELECT USING (
    organization_id = get_user_organization_id()
  );

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update profiles in their organization"
  ON public.profiles FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin' AND p.organization_id = public.profiles.organization_id
    )
  );

CREATE POLICY "Admins can delete profiles in their organization"
  ON public.profiles FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'Admin' AND p.organization_id = public.profiles.organization_id
    )
  );

-- 3. Create Companies Table (tenant-linked, supports soft deletes)
CREATE TABLE public.companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  size TEXT,
  arr_estimate NUMERIC,
  engagement_score INTEGER DEFAULT 0,
  website TEXT,
  linkedin TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 4. Create Contacts Table (tenant-linked, supports soft deletes)
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  designation TEXT,
  role TEXT,
  sentiment TEXT DEFAULT 'neutral',
  engagement_score INTEGER DEFAULT 0,
  linkedin TEXT,
  whatsapp TEXT,
  timezone TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 5. Create Deals (Pipeline) Table (tenant-linked, supports soft deletes)
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  arr NUMERIC NOT NULL,
  stage TEXT NOT NULL DEFAULT 'Discovery',
  engagement_score INTEGER DEFAULT 0,
  urgency TEXT DEFAULT 'medium',
  next_step TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 6. Create Tasks Table (tenant-linked, supports soft deletes)
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  due TIMESTAMP WITH TIME ZONE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 7. Create Meetings Table (tenant-linked, supports soft deletes)
CREATE TABLE public.meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration INTEGER NOT NULL,
  platform TEXT,
  meeting_link TEXT,
  status TEXT DEFAULT 'scheduled',
  attendees TEXT[] DEFAULT '{}',
  notes TEXT,
  ai_summary TEXT,
  next_action TEXT,
  pain_points TEXT[] DEFAULT '{}',
  objections TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 8. Create Documents Table (tenant-linked, supports soft deletes)
CREATE TABLE public.documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT,
  size TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- 9. Create Sequences Table (tenant-linked, supports soft deletes)
CREATE TABLE public.sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'inactive',
  steps INTEGER DEFAULT 0,
  enrolled INTEGER DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  channel TEXT,
  nodes JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS for all operational tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;

-- 10. Organization Isolation Policies (RLS)
CREATE POLICY "Tenant isolation check" ON public.organizations FOR SELECT TO authenticated
  USING (id = get_user_organization_id());

CREATE POLICY "Tenant isolation check" ON public.companies FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.contacts FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.deals FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.tasks FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.meetings FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.documents FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.sequences FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id() AND deleted_at IS NULL);


-- 10.3 Create Invitations Table
CREATE TABLE IF NOT EXISTS public.invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Member',
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant isolation check" ON public.invitations FOR ALL TO authenticated
  USING (organization_id = get_user_organization_id());


-- 10.4 Create Google Credentials Table
CREATE TABLE IF NOT EXISTS public.user_google_credentials (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.user_google_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own Google credentials" ON public.user_google_credentials FOR ALL TO authenticated
  USING (auth.uid() = user_id);


-- 10.5 Create Team Members View
CREATE OR REPLACE VIEW public.team_members AS
SELECT 
  id::text AS id,
  full_name AS name,
  email,
  role,
  'active' AS status,
  SUBSTRING(COALESCE(full_name, email) FROM 1 FOR 2) AS initials,
  '#3b82f6' AS color
FROM public.profiles
WHERE organization_id = get_user_organization_id()
UNION ALL
SELECT 
  id::text AS id,
  split_part(email, '@', 1) AS name,
  email,
  role,
  'invited' AS status,
  UPPER(SUBSTRING(email FROM 1 FOR 2)) AS initials,
  '#f59e0b' AS color
FROM public.invitations
WHERE organization_id = get_user_organization_id() AND accepted_at IS NULL;


-- 10.6 Triggers for automatic organization_id insertion
CREATE OR REPLACE FUNCTION set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.organization_id IS NULL THEN
    NEW.organization_id := get_user_organization_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_companies_org_id BEFORE INSERT ON public.companies FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_contacts_org_id BEFORE INSERT ON public.contacts FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_deals_org_id BEFORE INSERT ON public.deals FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_tasks_org_id BEFORE INSERT ON public.tasks FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_meetings_org_id BEFORE INSERT ON public.meetings FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_documents_org_id BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_sequences_org_id BEFORE INSERT ON public.sequences FOR EACH ROW EXECUTE PROCEDURE set_organization_id();
CREATE TRIGGER set_invitations_org_id BEFORE INSERT ON public.invitations FOR EACH ROW EXECUTE PROCEDURE set_organization_id();


-- 11. Trigger to automatically create a default organization and profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  target_org_id UUID;
  target_role TEXT;
BEGIN
  IF NEW.raw_user_meta_data->>'organization_id' IS NOT NULL THEN
    -- User was invited
    target_org_id := (NEW.raw_user_meta_data->>'organization_id')::UUID;
    target_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Member');
    
    -- Mark invitation as accepted if token is provided
    IF NEW.raw_user_meta_data->>'invite_token' IS NOT NULL THEN
      UPDATE public.invitations 
      SET accepted_at = TIMEZONE('utc', NOW()) 
      WHERE token = NEW.raw_user_meta_data->>'invite_token';
    END IF;
  ELSE
    -- Sign up standard flow
    INSERT INTO public.organizations (name)
    VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Workspace'))
    RETURNING id INTO target_org_id;
    
    target_role := 'Admin';
  END IF;

  -- Create their profile referencing the organization and role
  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    target_role,
    target_org_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 12. RPC for verifying invitation token safely
CREATE OR REPLACE FUNCTION verify_invitation_token(p_token TEXT)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  email TEXT,
  role TEXT,
  token TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  organization_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    i.id, i.organization_id, i.email, i.role, i.token, i.created_at, i.accepted_at,
    o.name AS organization_name
  FROM public.invitations i
  LEFT JOIN public.organizations o ON i.organization_id = o.id
  WHERE i.token = p_token;
END;
$$;
