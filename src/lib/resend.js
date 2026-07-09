// ============================================
// HUNTLO SALES OS — RESEND EMAIL CLIENT
// ============================================
import useAuthStore from '../store/useAuthStore';

const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY;
const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173';
const isConfigured = RESEND_API_KEY && RESEND_API_KEY !== 'your_resend_api_key';

// Send team invitation email via Gmail or Resend
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

  const appUrl = import.meta.env.VITE_APP_URL || window.location.origin;
  const inviteUrl = `${appUrl}/accept-invite?token=${inviteToken}`;
  const subject = `${inviterName} invited you to Huntlo Sales OS`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: 'Inter', -apple-system, sans-serif; background: #f8fafc; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    .wrapper { max-width: 560px; margin: 40px auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03); }
    .header { background: #ffffff; padding: 32px 40px 24px; border-bottom: 1px solid #f1f5f9; }
    .logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.03em; }
    .logo span { color: #2563eb; }
    .body { padding: 36px 40px; }
    h1 { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px; letter-spacing: -0.01em; }
    p { font-size: 14px; color: #475569; line-height: 1.65; margin: 0 0 24px; }
    .btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600; text-align: center; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2); }
    .meta { margin-top: 32px; padding-top: 24px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; line-height: 1.5; }
    .badge { display: inline-block; background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <div class="logo">Huntlo<span> OS</span></div>
    </div>
    <div class="body">
      <div class="badge">${role}</div>
      <h1>Join the sales team</h1>
      <p>
        <strong style="color: #0f172a">${inviterName}</strong> has invited you to join 
        <strong style="color: #0f172a">Huntlo Sales OS</strong> — an AI-native enterprise 
        sales operating system. You've been assigned the <strong style="color: #0f172a">${role}</strong> role.
      </p>
      <p>Click below to accept the invitation and set up your account:</p>
      <div style="margin: 30px 0;">
        <a href="${inviteUrl}" class="btn">Accept Invitation →</a>
      </div>
      <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
        If the button doesn't work, you can copy and paste this link into your browser: <br/>
        <a href="${inviteUrl}" style="color: #2563eb; text-decoration: none; word-break: break-all;">${inviteUrl}</a>
      </p>
      <div class="meta">
        This invitation is secure and intended for ${toEmail}. If you didn't expect this email, you can safely ignore it.<br/>
        © 2026 Huntlo Sales OS
      </div>
    </div>
  </div>
</body>
</html>
  `;

  if (token) {
    try {
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

      if (res.ok) {
        const data = await res.json();
        return { success: true, id: data.id, gmail: true };
      } else {
        console.warn('Gmail API send failed for invite, trying Resend...', await res.text());
      }
    } catch (err) {
      console.warn('Gmail API send failed for invite, trying Resend...', err);
    }
  }

  if (!isConfigured) {
    console.warn(`[Resend] Demo Mode: Would send invite email to ${toEmail}.`);
    await new Promise(r => setTimeout(r, 600));
    return { success: true, demo: true };
  }

  try {
    const endpoint = '/api/resend/emails';
    
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `Huntlo Sales OS <onboarding@resend.dev>`,
        to: [toEmail],
        subject,
        html: htmlBody
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || 'Failed to send invite email via Resend');
    }

    const data = await res.json();
    return { success: true, id: data.id };
  } catch (err) {
    console.error('[Resend Invite Send Error]:', err);
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
