// ============================================
// HUNTLO SALES OS — RESEND EMAIL CLIENT
// ============================================
import useAuthStore from '../store/useAuthStore';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const isConfigured = RESEND_API_KEY && RESEND_API_KEY !== 'your_resend_api_key';

// Send team invitation email via Gmail API
export async function sendTeamInvitation({ toEmail, toName, inviterName, role, inviteToken }) {
  const session = useAuthStore.getState().session;
  let token = session?.provider_token;
  
  if (!token) {
    try {
      const { supabase } = await import('./supabase');
      const { user } = useAuthStore.getState();
      if (user) {
        const { data: creds } = await supabase
          .from('user_google_credentials')
          .select('access_token')
          .eq('user_id', user.id)
          .maybeSingle();
        if (creds) token = creds.access_token;
      }
    } catch (err) {
      console.warn('Failed to query user_google_credentials for invite:', err);
    }
  }

  // If still no token, return error
  if (!token) {
    return { 
      success: false, 
      error: 'Google Workspace is not connected. Please connect your Google account in Settings > Integrations first to send team invitations.' 
    };
  }

  const inviteUrl = `${APP_URL}/accept-invite?token=${inviteToken}`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #0a0a0b; margin: 0; padding: 0; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #111114; border: 1px solid #222229; border-radius: 14px; overflow: hidden; }
    .header { background: #111114; padding: 32px 40px 24px; border-bottom: 1px solid #222229; }
    .logo { font-size: 18px; font-weight: 700; color: #f0f0f5; letter-spacing: -0.02em; }
    .logo span { color: #3b82f6; }
    .body { padding: 32px 40px; }
    h1 { font-size: 22px; font-weight: 600; color: #f0f0f5; margin: 0 0 12px; }
    p { font-size: 14px; color: #8b8b9a; line-height: 1.6; margin: 0 0 20px; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 600; }
    .meta { margin-top: 28px; padding-top: 20px; border-top: 1px solid #222229; font-size: 12px; color: #4a4a5a; }
    .badge { display: inline-block; background: rgba(59,130,246,0.1); color: #3b82f6; border: 1px solid rgba(59,130,246,0.2); padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 500; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Huntlo <span>Sales OS</span></div>
    </div>
    <div class="body">
      <div class="badge">${role}</div>
      <h1>You're invited to join the team</h1>
      <p>
        <strong style="color: #f0f0f5">${inviterName}</strong> has invited you to join 
        <strong style="color: #f0f0f5">Huntlo Sales OS</strong> — an AI-native enterprise 
        sales operating system. You've been assigned the <strong style="color: #f0f0f5">${role}</strong> role.
      </p>
      <p>Click below to accept the invitation and set up your account:</p>
      <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
      <div class="meta">
        This invitation expires in 7 days. If you didn't expect this email, you can safely ignore it.<br/>
        © 2026 Huntlo Sales OS
      </div>
    </div>
  </div>
</body>
</html>
  `;

  try {
    const subject = `${inviterName} invited you to Huntlo Sales OS`;
    const mime = [
      `To: ${toEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody
    ].join('\r\n');
    
    const raw = btoa(unescape(encodeURIComponent(mime)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
      
    const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Gmail API error: ${errText}`);
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Gmail Invite Send Error]:', err);
    return { success: false, error: err.message };
  }
}

// Generate a simple invite token
export function generateInviteToken() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Send a plain text B2B sales sequence email
export async function sendSequenceEmail({ toEmail, subject, body, fromName = 'Huntlo Sales', replyTo }) {
  const session = useAuthStore.getState().session;
  const token = session?.provider_token;
  
  if (token) {
    try {
      const mime = [
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body.split('\n').map(line => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1f2937;">${line}</p>`).join('')
      ].join('\r\n');
      
      const raw = btoa(unescape(encodeURIComponent(mime)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
        
      const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw })
      });
      
      if (res.ok) {
        const data = await res.json();
        return { success: true, id: data.id, gmail: true };
      } else {
        console.warn('Gmail API send failed, trying Resend...', await res.text());
      }
    } catch (err) {
      console.warn('Gmail API send failed, trying Resend...', err);
    }
  }

  if (!isConfigured) {
    console.warn(`[Resend] Demo Mode: Would send sequence email to ${toEmail}. Subject: ${subject}`);
    await new Promise(r => setTimeout(r, 600));
    return { success: true, demo: true, message: `Demo mode: Sent to ${toEmail}` };
  }

  // Convert plain text body with newlines to HTML paragraphs for standard B2B look
  const htmlBody = body.split('\n').map(line => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 14px; color: #1f2937;">${line}</p>`).join('');

  try {
    const endpoint = '/api/resend/emails';
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <onboarding@resend.dev>`,
        to: [toEmail],
        subject,
        html: htmlBody,
        ...(replyTo ? { reply_to: replyTo } : {})
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send sequence email');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Resend Sequence Error]:', err);
    return { success: false, error: err.message };
  }
}

export { isConfigured as isResendConfigured };
