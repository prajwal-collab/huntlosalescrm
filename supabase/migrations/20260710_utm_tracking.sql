-- UTM Links Table
CREATE TABLE IF NOT EXISTS public.utm_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    asset_name TEXT NOT NULL,
    purpose TEXT,
    base_url TEXT NOT NULL,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    utm_content TEXT,
    full_utm_url TEXT NOT NULL,
    short_code TEXT UNIQUE NOT NULL,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0
);

-- RLS Policies for utm_links
ALTER TABLE public.utm_links ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own links
CREATE POLICY "Users can view their own utm links"
    ON public.utm_links FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own links
CREATE POLICY "Users can insert their own utm links"
    ON public.utm_links FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow the system/public to view by short_code for redirection
-- We allow anonymous access here because anyone clicking the link needs to be redirected
CREATE POLICY "Anyone can view links by short_code"
    ON public.utm_links FOR SELECT
    USING (true);

-- Function to safely increment clicks and return the full URL
CREATE OR REPLACE FUNCTION public.increment_utm_click(p_short_code TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_full_url TEXT;
BEGIN
    UPDATE public.utm_links
    SET clicks = clicks + 1
    WHERE short_code = p_short_code
    RETURNING full_utm_url INTO v_full_url;

    RETURN v_full_url;
END;
$$;

-- Enable Realtime for utm_links so dashboard can update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.utm_links;
