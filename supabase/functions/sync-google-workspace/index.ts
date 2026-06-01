import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { providerToken } = await req.json();

    if (!providerToken) {
      return new Response(JSON.stringify({ error: 'providerToken is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization header is required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authenticated' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch Google Calendar Events
    const timeMin = new Date().toISOString();
    const calendarUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&maxResults=10&singleEvents=true&orderBy=startTime`;
    
    const calRes = await fetch(calendarUrl, {
      headers: { Authorization: `Bearer ${providerToken}` }
    });
    
    if (!calRes.ok) {
      const err = await calRes.text();
      console.error('Calendar Error:', err);
      throw new Error('Failed to fetch from Google Calendar: ' + err);
    }
    
    const calData = await calRes.json();
    const events = calData.items || [];

    // Map and insert into meetings
    let syncedMeetingsCount = 0;
    for (const event of events) {
      const startTime = event.start.dateTime || event.start.date;
      const endTime = event.end.dateTime || event.end.date;
      const title = event.summary || 'Untitled Event';
      
      const { error: dbError } = await supabase.from('meetings').insert({
        owner_id: user.id,
        title: title,
        date: startTime,
        time: startTime.split('T')[1]?.substring(0,5) || '00:00',
        duration: 30, // Default duration if not easily calculated
        attendees: event.attendees ? event.attendees.map(a => a.email).join(', ') : '',
        status: 'scheduled',
        notes: event.description || '',
        platform: event.hangoutLink ? 'Google Meet' : 'Other',
        meeting_link: event.hangoutLink || ''
      });
      
      if (!dbError) {
        syncedMeetingsCount++;
      } else {
        console.error('Failed to insert meeting:', dbError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: `Successfully synced ${syncedMeetingsCount} meetings from Google Calendar.` 
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('Function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
