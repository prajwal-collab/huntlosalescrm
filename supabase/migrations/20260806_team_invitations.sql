-- Migration: team_invitations
-- Creates the invitations table and verification RPC

CREATE TABLE IF NOT EXISTS public.invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email text NOT NULL,
    role text NOT NULL DEFAULT 'Member',
    token text NOT NULL UNIQUE,
    organization_id uuid,
    organization_name text,
    accepted_at timestamp with time zone,
    invited_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to verify token
CREATE POLICY "Anyone can verify invite token"
    ON public.invitations FOR SELECT
    USING (true);

-- Allow authenticated users to create and manage invites
CREATE POLICY "Authenticated users can manage invites"
    ON public.invitations FOR ALL
    USING (auth.role() = 'authenticated');

-- RPC to verify invitation token safely
CREATE OR REPLACE FUNCTION public.verify_invitation_token(p_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    invite_record record;
BEGIN
    SELECT * INTO invite_record
    FROM public.invitations
    WHERE token = p_token
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid token';
    END IF;

    RETURN row_to_json(invite_record);
END;
$$;
