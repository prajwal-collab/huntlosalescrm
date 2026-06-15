import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

console.log("Receive Webhook Function Started");

serve(async (req) => {
  // CORS Headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing token' }), { status: 401 });
    }

    // Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Validate Token and get Organization ID
    const { data: config, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('secret_token', token)
      .single();

    if (configError || !config) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), { status: 401 });
    }

    if (!config.is_enabled) {
      return new Response(JSON.stringify({ error: 'Webhook integration is disabled for this token' }), { status: 403 });
    }

    // 2. Read Payload
    let payload;
    try {
      payload = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), { status: 400 });
    }

    // 3. Log the incoming event
    const { data: eventLog, error: eventError } = await supabase
      .from('webhook_events')
      .insert({
        organization_id: config.organization_id,
        source: config.source_type || 'generic',
        payload: payload,
        status: 'received'
      })
      .select()
      .single();

    if (eventError) {
      console.error('Failed to log webhook event:', eventError);
    }

    const eventId = eventLog?.id;

    // 4. Process the payload (RB2B logic as primary expected format)
    if (config.auto_create_leads) {
      try {
        let companyId = null;
        let leadId = null;

        // Extract RB2B-style fields
        const companyData = payload.company || payload.organization;
        const personData = payload.person || payload.contact || payload.user;

        // Upsert Company
        if (companyData && companyData.name) {
          const arrEstimate = parseFloat(companyData.estimated_revenue) || 0;
          
          const { data: company, error: compErr } = await supabase
            .from('companies')
            .upsert({
              organization_id: config.organization_id,
              name: companyData.name,
              website: companyData.domain || companyData.website,
              industry: companyData.industry,
              size: companyData.employee_count || companyData.size,
              linkedin: companyData.linkedin_url,
              arr_estimate: arrEstimate
            }, { onConflict: 'organization_id,name', ignoreDuplicates: false })
            .select()
            .single();

          if (!compErr && company) {
            companyId = company.id;
          } else {
            console.error('Company upsert error:', compErr);
          }
        }

        // Upsert Lead/Contact
        if (personData && (personData.email || personData.first_name || personData.last_name)) {
          const fullName = `${personData.first_name || ''} ${personData.last_name || ''}`.trim() || personData.name;
          const contactEmail = personData.email || personData.work_email;

          if (fullName || contactEmail) {
            const { data: lead, error: leadErr } = await supabase
              .from('leads')
              .upsert({
                organization_id: config.organization_id,
                email: contactEmail,
                company_name: companyData?.name || 'Unknown',
                contact_name: fullName,
                designation: personData.title || personData.designation,
                linkedin: personData.linkedin_url,
                stage: 'New Lead',
                source: 'Webhook',
                signals: {
                  website_visitor: true // Flag as inbound signal
                }
              }, { onConflict: 'organization_id,email', ignoreDuplicates: false })
              .select()
              .single();

            if (!leadErr && lead) {
              leadId = lead.id;
            } else {
              console.error('Lead upsert error:', leadErr);
            }
          }
        }

        // Update event log with success and reference
        if (eventId) {
          await supabase
            .from('webhook_events')
            .update({
              status: 'processed',
              lead_id: leadId
            })
            .eq('id', eventId);
        }

      } catch (processingErr) {
        console.error('Processing error:', processingErr);
        // Mark event as failed
        if (eventId) {
          await supabase
            .from('webhook_events')
            .update({
              status: 'failed',
              error_message: processingErr.message
            })
            .eq('id', eventId);
        }
      }
    } else {
      // Auto create is disabled, just mark as processed/skipped processing
      if (eventId) {
        await supabase
          .from('webhook_events')
          .update({ status: 'skipped', error_message: 'Auto-create disabled' })
          .eq('id', eventId);
      }
    }

    return new Response(JSON.stringify({ success: true, message: 'Webhook received' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500
    });
  }
});
