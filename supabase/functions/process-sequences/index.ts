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

    // 2. Initialize SMTP Transporter
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.gmail.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER')!;
    const smtpPass = Deno.env.get('SMTP_PASS')!;
    
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials are not configured in environment variables.");
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, 
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

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
        // 5. Send Email via SMTP
        await transporter.sendMail({
          from: `"Huntlo SDR" <${smtpUser}>`,
          to: contact.email,
          subject: subject,
          text: body, // Fallback plain text
          html: body.replace(/\n/g, '<br>'),
        });

        emailsSent++;

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
