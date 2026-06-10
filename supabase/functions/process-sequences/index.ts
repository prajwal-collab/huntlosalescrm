import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as nodemailer from 'https://esm.sh/nodemailer@6.9.9';

console.log("Process Sequences Function Started");

serve(async (req) => {
  try {
    // 1. Initialize Supabase Client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Initialize Transporter Cache
    // We will dynamically fetch each SDR's SMTP settings from user_email_settings
    const transporterCache = new Map();

    const getSdrTransporter = async (userId: string) => {
      if (transporterCache.has(userId)) return transporterCache.get(userId);

      const { data, error } = await supabase
        .from('user_email_settings')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        console.error(`No SMTP settings found for user ${userId}`);
        transporterCache.set(userId, null);
        return null;
      }

      const transporter = nodemailer.createTransport({
        host: data.smtp_host,
        port: data.smtp_port,
        secure: data.smtp_port === 465, 
        auth: {
          user: data.smtp_user,
          pass: data.smtp_pass,
        },
      });

      const config = { transporter, senderName: data.sender_name || 'Sales Representative', smtpUser: data.smtp_user };
      transporterCache.set(userId, config);
      return config;
    };

    const getSdrGoogleToken = async (userId: string) => {
      const { data, error } = await supabase
        .from('user_google_credentials')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (error || !data) return null;
      
      const expiresAt = new Date(data.expires_at).getTime();
      const now = Date.now();
      // Refresh token if expiring in less than 5 minutes
      if (expiresAt - now < 5 * 60 * 1000 && data.refresh_token) {
        try {
          const clientId = Deno.env.get('GOOGLE_CLIENT_ID') || '';
          const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET') || '';
          
          const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: clientId,
              client_secret: clientSecret,
              refresh_token: data.refresh_token,
              grant_type: 'refresh_token',
            }),
          });
          
          if (refreshRes.ok) {
            const tokenData = await refreshRes.json();
            const newAccessToken = tokenData.access_token;
            const newExpiresAt = new Date(Date.now() + (tokenData.expires_in || 3600) * 1000).toISOString();
            
            await supabase
              .from('user_google_credentials')
              .update({ access_token: newAccessToken, expires_at: newExpiresAt })
              .eq('user_id', userId);
            
            return newAccessToken;
          } else {
            console.error('Failed to refresh Google token:', await refreshRes.text());
          }
        } catch (refreshErr) {
          console.error('Error refreshing Google token:', refreshErr);
        }
      }
      
      return data.access_token;
    };

    // 3. Fetch Enrollments due for sending
    // We only fetch 'active' enrollments where next_step_due is in the past.
    const { data: dueEnrollments, error: enrollError } = await supabase
      .from('sequence_enrollments')
      .select(`
        id, 
        current_step, 
        contact_id, 
        sequence_id,
        contacts ( name, email, company, designation ),
        sequences ( name, daily_limit, user_id )
      `)
      .eq('status', 'active')
      .lte('next_step_due', new Date().toISOString())
      .limit(100); // Process in batches to respect daily limits roughly.

    if (enrollError) throw enrollError;

    if (!dueEnrollments || dueEnrollments.length === 0) {
      return new Response(JSON.stringify({ message: "No sequences due for sending." }), {
        headers: { "Content-Type": "application/json" },
        status: 200
      });
    }

    let emailsSent = 0;

    // 4. Process each enrollment
    for (const enrollment of dueEnrollments) {
      const contact = enrollment.contacts;
      const sequence = enrollment.sequences;

      if (!contact || !contact.email) continue;

      // Fetch the specific step content
      const { data: stepInfo, error: stepError } = await supabase
        .from('sequence_steps')
        .select('*')
        .eq('sequence_id', enrollment.sequence_id)
        .eq('step_order', enrollment.current_step)
        .single();

      if (stepError || !stepInfo) {
        console.error(`Step not found for enrollment ${enrollment.id}`);
        continue;
      }

      // Personalize the email content
      let subject = stepInfo.subject || sequence.name;
      let body = stepInfo.content || '';
      
      // Basic token replacement
      const firstName = contact.name ? contact.name.split(' ')[0] : 'there';
      body = body.replace(/{{first_name}}/ig, firstName);
      body = body.replace(/{{company}}/ig, contact.company || 'your company');

      // Append Unsubscribe Link
      const unsubscribeUrl = `${Deno.env.get('APP_URL')}/api/unsubscribe?e=${enrollment.id}`;
      body += `\n\n--\nTo unsubscribe from these emails, click here: ${unsubscribeUrl}`;

      try {
        let sent = false;
        const googleToken = await getSdrGoogleToken(sequence.user_id);
        
        if (googleToken) {
          try {
            const mime = [
              `To: ${contact.email}`,
              `Subject: ${subject}`,
              'MIME-Version: 1.0',
              'Content-Type: text/html; charset=utf-8',
              '',
              body.replace(/\n/g, '<br>')
            ].join('\r\n');
            
            const encodedMime = btoa(unescape(encodeURIComponent(mime)))
              .replace(/\+/g, '-')
              .replace(/\//g, '_')
              .replace(/=+$/, '');
            
            const gmailRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${googleToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ raw: encodedMime })
            });
            
            if (gmailRes.ok) {
              emailsSent++;
              sent = true;
            } else {
              console.error(`Gmail API send failed for ${contact.email}:`, await gmailRes.text());
            }
          } catch (gmailErr) {
            console.error(`Gmail API error for ${contact.email}:`, gmailErr);
          }
        }
        
        if (!sent) {
          // 5. Send Email via SMTP
          const sdrConfig = await getSdrTransporter(sequence.user_id);
          if (!sdrConfig) {
            console.warn(`Skipping email to ${contact.email} - No SMTP or Google credentials settings for SDR ${sequence.user_id}`);
            continue; // Skip this enrollment until they configure SMTP or Google
          }

          await sdrConfig.transporter.sendMail({
            from: `"${sdrConfig.senderName}" <${sdrConfig.smtpUser}>`,
            to: contact.email,
            subject: subject,
            text: body, // Fallback plain text
            html: body.replace(/\n/g, '<br>'),
          });

          emailsSent++;
        }

        // 6. Update Enrollment to next step
        const nextStepOrder = enrollment.current_step + 1;
        
        // Check if next step exists to calculate delay
        const { data: nextStep } = await supabase
          .from('sequence_steps')
          .select('day_delay')
          .eq('sequence_id', enrollment.sequence_id)
          .eq('step_order', nextStepOrder)
          .single();

        if (nextStep) {
          // Schedule next step
          const nextDate = new Date();
          nextDate.setDate(nextDate.getDate() + (nextStep.day_delay || 1));
          
          await supabase.from('sequence_enrollments')
            .update({ 
              current_step: nextStepOrder,
              next_step_due: nextDate.toISOString() 
            })
            .eq('id', enrollment.id);
        } else {
          // Sequence completed
          await supabase.from('sequence_enrollments')
            .update({ status: 'completed' })
            .eq('id', enrollment.id);
        }

      } catch (sendErr) {
        console.error(`Failed to send email to ${contact.email}:`, sendErr);
      }
    }

    return new Response(JSON.stringify({ 
      message: `Successfully processed due sequences. Emails sent: ${emailsSent}` 
    }), {
      headers: { "Content-Type": "application/json" },
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
