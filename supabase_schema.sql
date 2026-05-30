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

-- RLS Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone in organization." 
  ON public.profiles FOR SELECT USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own profile." 
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

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
  USING (id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "Tenant isolation check" ON public.companies FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.contacts FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.deals FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.tasks FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.meetings FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.documents FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);

CREATE POLICY "Tenant isolation check" ON public.sequences FOR ALL TO authenticated
  USING (organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) AND deleted_at IS NULL);


-- 11. Trigger to automatically create a default organization and profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_org_id UUID;
BEGIN
  -- Create a default organization for the new user
  INSERT INTO public.organizations (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'organization_name', 'My Workspace'))
  RETURNING id INTO default_org_id;

  -- Create their profile referencing the new organization
  INSERT INTO public.profiles (id, email, full_name, role, organization_id)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'Admin', -- First user is workspace Admin
    default_org_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
