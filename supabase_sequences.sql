-- ==========================================
-- HUNTLO SALES OS: EMAIL SEQUENCES SCHEMA
-- ==========================================

-- 1. Create Tables
DROP TABLE IF EXISTS public.sequence_enrollments;
DROP TABLE IF EXISTS public.sequence_steps;
DROP TABLE IF EXISTS public.sequences;

CREATE TABLE public.sequences (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  channel text not null default 'Email',
  status text not null default 'inactive',
  steps integer not null default 0,
  enrolled integer not null default 0,
  reply_rate integer not null default 0,
  daily_limit integer not null default 100,
  user_id uuid default auth.uid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.sequence_steps (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references public.sequences(id) on delete cascade not null,
  step_order integer not null,
  type text not null default 'email',
  day_delay integer not null default 1,
  subject text,
  content text,
  user_id uuid default auth.uid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

CREATE TABLE public.sequence_enrollments (
  id uuid default gen_random_uuid() primary key,
  sequence_id uuid references public.sequences(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  current_step integer not null default 1,
  status text not null default 'active', 
  next_step_due timestamp with time zone not null,
  user_id uuid default auth.uid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sequence_id, contact_id)
);

-- 2. Row Level Security (RLS)
ALTER TABLE public.sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sequence_enrollments ENABLE ROW LEVEL SECURITY;

create policy "Users can view their sequences" on public.sequences for select using (auth.uid() = user_id);
create policy "Users can insert their sequences" on public.sequences for insert with check (auth.uid() = user_id);
create policy "Users can update their sequences" on public.sequences for update using (auth.uid() = user_id);
create policy "Users can delete their sequences" on public.sequences for delete using (auth.uid() = user_id);

create policy "Users can view their steps" on public.sequence_steps for select using (auth.uid() = user_id);
create policy "Users can insert their steps" on public.sequence_steps for insert with check (auth.uid() = user_id);
create policy "Users can update their steps" on public.sequence_steps for update using (auth.uid() = user_id);
create policy "Users can delete their steps" on public.sequence_steps for delete using (auth.uid() = user_id);

create policy "Users can view their enrollments" on public.sequence_enrollments for select using (auth.uid() = user_id);
create policy "Users can insert their enrollments" on public.sequence_enrollments for insert with check (auth.uid() = user_id);
create policy "Users can update their enrollments" on public.sequence_enrollments for update using (auth.uid() = user_id);
create policy "Users can delete their enrollments" on public.sequence_enrollments for delete using (auth.uid() = user_id);
